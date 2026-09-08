/**
 * VE MANAGEMENT — Production Cloud Synchronization Client (SyncManager)
 * School: Gameri Higher Secondary School, Gamiri (GAMERI-HSS-001)
 * Automated Bidirectional Offline-First Sync with Cloudflare Workers Backend.
 */

(function(global) {
  'use strict';

  const DEFAULT_API_URL = "https://ve-management-api.iamrocky899.workers.dev";
  const STORAGE_KEY_QUEUE = 'itd3_sync_queue';
  const STORAGE_KEY_API_URL = 'itd3_cloud_api_url';
  const STORAGE_KEY_ADMIN_KEY = 'itd3_admin_sync_key';
  const STORAGE_KEY_LAST_SYNC = 'itd3_last_cloud_sync';
  const DEFAULT_ADMIN_KEY = 'GHSS_ADMIN_SECURE_KEY_2026';
  const MAX_RETRY_ATTEMPTS = 5;
  const BASE_BACKOFF_MS = 2000;
  const MAX_BACKOFF_MS = 60000;
  const DEFAULT_DEBOUNCE_MS = 50;

  const SyncManager = {
    isSyncing: false,
    needSubsequentFlush: false,
    syncTimer: null,
    statusListener: null,
    lastSyncStatus: 'IDLE',

    /**
     * Gets the configured Web App API URL.
     */
    getApiUrl: function() {
      if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY_API_URL);
        if (stored && (stored.includes('script.google.com') || stored.includes('script.googleusercontent.com') || stored.includes('localhost') || stored.startsWith('http:'))) {
          localStorage.removeItem(STORAGE_KEY_API_URL);
          return DEFAULT_API_URL;
        }
        return stored || DEFAULT_API_URL;
      }
      return DEFAULT_API_URL;
    },

    /**
     * Sets the configured Web App API URL.
     */
    setApiUrl: function(url) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_API_URL, url || DEFAULT_API_URL);
      }
    },

    /**
     * Gets the Admin Sync Key from localStorage or default.
     */
    getAdminKey: function() {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(STORAGE_KEY_ADMIN_KEY) || DEFAULT_ADMIN_KEY;
      }
      return DEFAULT_ADMIN_KEY;
    },

    /**
     * Sets the Admin Sync Key in localStorage.
     */
    setAdminKey: function(key) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_ADMIN_KEY, key || DEFAULT_ADMIN_KEY);
      }
    },

    /**
     * Gets the configured permanent School ID.
     */
    getSchoolId: function() {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem('itd3_school_id') || 'GAMERI-HSS-001';
      }
      return 'GAMERI-HSS-001';
    },

    /**
     * Sets the permanent School ID.
     */
    setSchoolId: function(id) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('itd3_school_id', id || 'GAMERI-HSS-001');
      }
    },

    /**
     * Gets the configured School Name.
     */
    getSchoolName: function() {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem('itd3_school_name') || 'Gameri Higher Secondary School, Gamiri';
      }
      return 'Gameri Higher Secondary School, Gamiri';
    },

    /**
     * Sets the School Name.
     */
    setSchoolName: function(name) {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('itd3_school_name', name || 'Gameri Higher Secondary School, Gamiri');
      }
    },

    /**
     * Checks if the device is currently online.
     */
    isOnline: function() {
      if (typeof window !== 'undefined' && window.Android && typeof window.Android.isNetworkAvailable === 'function') {
        return window.Android.isNetworkAvailable();
      }
      if (typeof navigator !== 'undefined' && navigator.onLine !== undefined) {
        return navigator.onLine;
      }
      return true;
    },

    /**
     * Gets the persistent SyncQueue from localStorage.
     */
    getQueue: function() {
      try {
        if (typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem(STORAGE_KEY_QUEUE);
          return raw ? JSON.parse(raw) : [];
        }
      } catch (e) {
        console.error("[SyncManager] Failed to read queue:", e);
      }
      return [];
    },

    /**
     * Saves the SyncQueue array to localStorage.
     */
    saveQueue: function(queue) {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(queue));
        }
      } catch (e) {
        console.error("[SyncManager] Failed to save queue:", e);
      }
    },

    /**
     * Enqueues a local change for offline-safe synchronization.
     * Guarantees local operation is never blocked.
     */
    enqueue: function(entity, entityId, operation, payload) {
      if (entity === 'Faces' || entity === 'itd3_f') {
        return null; // Never sync biometric embeddings
      }

      const queue = this.getQueue();
      const nowStr = new Date().toISOString();
      const syncId = `SYNC_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const existingIdx = queue.findIndex(function(item) {
        return item.entity === entity && String(item.entityId) === String(entityId) && (item.status === 'PENDING' || item.status === 'FAILED');
      });

      const queueItem = {
        syncId: syncId,
        entity: entity,
        entityId: String(entityId),
        operation: operation || 'UPSERT',
        payload: payload,
        createdAt: nowStr,
        attemptCount: 0,
        lastAttemptAt: null,
        status: 'PENDING',
        errorCode: null,
        errorMessage: null
      };

      if (existingIdx > -1) {
        queue[existingIdx] = queueItem;
      } else {
        queue.push(queueItem);
      }

      this.saveQueue(queue);
      this.notifyStatusChange();

      // Schedule debounced auto sync
      this.scheduleAutoSync(DEFAULT_DEBOUNCE_MS);
      return syncId;
    },

    /**
     * Schedules debounced automatic synchronization.
     */
    scheduleAutoSync: function(delayMs) {
      delayMs = delayMs !== undefined ? delayMs : DEFAULT_DEBOUNCE_MS;
      if (this.syncTimer) {
        clearTimeout(this.syncTimer);
      }
      const self = this;
      this.syncTimer = setTimeout(function() {
        self.triggerAutoSync(false);
      }, delayMs);
    },

    /**
     * Main Bidirectional Synchronization Orchestrator.
     * 1. Check internet & account
     * 2. If online: upload pending changes -> download latest cloud data -> merge safely -> update UI
     * 3. If offline: keep queue pending, do not block app.
     */
    triggerAutoSync: function(isManual, callback) {
      const self = this;

      if (this.isSyncing) {
        this.needSubsequentFlush = true;
        if (callback) callback({ status: 'BUSY' });
        return;
      }

      const queue = this.getQueue();
      const pendingItems = queue.filter(function(item) {
        return item.status === 'PENDING' || (item.status === 'FAILED' && item.attemptCount < MAX_RETRY_ATTEMPTS);
      });

      if (!isManual && pendingItems.length === 0) {
        // NO DATA CHANGE -> NO SYNC (Complies with Free-Plan zero write/read overhead)
        this.notifyStatusChange('IDLE');
        if (callback) callback({ status: 'IDLE', message: 'No pending changes to sync' });
        return;
      }

      if (!this.isOnline()) {
        this.notifyStatusChange('OFFLINE');
        if (callback) callback({ status: 'OFFLINE' });
        return;
      }

      this.isSyncing = true;
      this.notifyStatusChange('SYNCING');

      // Safety watchdog: clear lock after 30s in case of an unhandled network stall
      if (this._syncWatchdog) clearTimeout(this._syncWatchdog);
      this._syncWatchdog = setTimeout(function() {
        if (self.isSyncing) {
          console.warn("[SyncManager] Sync operation timed out after 30s. Releasing lock.");
          self.isSyncing = false;
          self.notifyStatusChange('ERROR', 'Sync timed out');
        }
      }, 30000);

      // Step 1: Upload Pending Queue
      this.uploadPendingQueue(function(uploadResult) {
        if (!uploadResult.success && uploadResult.error && uploadResult.error.code === 'NETWORK_ERROR') {
          if (self._syncWatchdog) clearTimeout(self._syncWatchdog);
          self.isSyncing = false;
          self.notifyStatusChange('OFFLINE');
          if (callback) callback({ status: 'OFFLINE' });
          return;
        }

        // Step 2: Download Latest Cloud Delta Changes
        self.downloadCloudDeltas(function(downloadResult) {
          if (self._syncWatchdog) clearTimeout(self._syncWatchdog);
          self.isSyncing = false;

          if (downloadResult.success && downloadResult.data) {
            // Step 3: Merge Cloud Data into Local Storage
            self.mergeCloudData(downloadResult.data);

            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const nowIso = now.toISOString();

            if (typeof localStorage !== 'undefined') {
              localStorage.setItem(STORAGE_KEY_LAST_SYNC, nowIso);
              localStorage.setItem('itd3_last_sync', `${now.toLocaleDateString()} ${timeStr}`);
            }

            self.notifyStatusChange('SYNCED', null, timeStr);

            if (isManual && typeof global.showToast === 'function') {
              global.showToast("Cloud Sync Completed Successfully!");
            }

            // Chain subsequent flush if new edits occurred mid-flight
            if (self.needSubsequentFlush) {
              self.needSubsequentFlush = false;
              self.scheduleAutoSync(500);
            }

            if (callback) callback({ status: 'SUCCESS', data: downloadResult.data });
          } else {
            const errMsg = downloadResult.error ? downloadResult.error.message : 'Sync download failed';
            self.notifyStatusChange('ERROR', errMsg);
            if (callback) callback({ status: 'ERROR', error: errMsg });
          }
        });
      });
    },

    /**
     * Uploads all pending items from local SyncQueue to Cloudflare Workers backend.
     */
    uploadPendingQueue: function(callback) {
      const queue = this.getQueue();
      const pendingItems = queue.filter(function(item) {
        return item.status === 'PENDING' || (item.status === 'FAILED' && item.attemptCount < MAX_RETRY_ATTEMPTS);
      });

      if (pendingItems.length === 0) {
        if (callback) callback({ success: true, count: 0 });
        return;
      }

      let staffToken = null;
      try {
        const sessionStr = (typeof localStorage !== 'undefined') ? localStorage.getItem('itd3_staff_session') : null;
        if (sessionStr) {
          const sessionObj = JSON.parse(sessionStr);
          if (sessionObj && sessionObj.token) staffToken = sessionObj.token;
        }
      } catch (e) {}

      const batchPayload = {
        action: 'sync_upload',
        token: staffToken || undefined,
        apiKey: !staffToken ? this.getAdminKey() : undefined,
        schoolId: this.getSchoolId(),
        clientSyncTimestamp: new Date().toISOString(),
        clientVersion: '5.7',
        students: [],
        attendance: {},
        marks: {},
        notes: [],
        activities: [],
        notices: []
      };

      const itemIdsToProcess = [];

      pendingItems.forEach(function(item) {
        itemIdsToProcess.push(item.syncId);
        item.status = 'SYNCING';
        item.lastAttemptAt = new Date().toISOString();
        item.attemptCount++;

        if (item.entity === 'Students' && item.payload) {
          if (Array.isArray(item.payload)) batchPayload.students = batchPayload.students.concat(item.payload);
          else batchPayload.students.push(item.payload);
        } else if (item.entity === 'Attendance' && item.payload) {
          Object.assign(batchPayload.attendance, item.payload);
        } else if (item.entity === 'Marks' && item.payload) {
          Object.assign(batchPayload.marks, item.payload);
        } else if (item.entity === 'TeacherNotes' && item.payload) {
          if (Array.isArray(item.payload)) batchPayload.notes = batchPayload.notes.concat(item.payload);
          else batchPayload.notes.push(item.payload);
        } else if (item.entity === 'Activities' && item.payload) {
          if (Array.isArray(item.payload)) batchPayload.activities = batchPayload.activities.concat(item.payload);
          else batchPayload.activities.push(item.payload);
        } else if (item.entity === 'Notices' && item.payload) {
          if (Array.isArray(item.payload)) batchPayload.notices = batchPayload.notices.concat(item.payload);
          else batchPayload.notices.push(item.payload);
        } else if (item.entity === 'Timetable' && item.payload) {
          batchPayload.timetable = item.payload;
        }
      });

      // Assign deterministic syncId for the batch derived from sorted pending item syncIds
      const sortedItemIds = itemIdsToProcess.slice().sort();
      const batchSyncId = 'BATCH_' + (sortedItemIds.length > 0 ? sortedItemIds.join('_').substring(0, 100) : ('CLI_' + Date.now()));
      batchPayload.syncId = batchSyncId;

      this.saveQueue(queue);
      const self = this;
      const apiUrl = this.getApiUrl();

      fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(batchPayload),
        redirect: 'follow'
      })
      .then(function(res) { return res.json(); })
      .then(function(result) {
        const currentQueue = self.getQueue();
        if (result && result.success) {
          const remaining = currentQueue.filter(function(q) {
            return !itemIdsToProcess.includes(q.syncId);
          });
          self.saveQueue(remaining);
          if (callback) callback({ success: true, result: result });
        } else {
          if (result && result.error && (result.error.code === 'ACCOUNT_DEACTIVATED' || result.error.code === 'SESSION_EXPIRED')) {
            if (typeof global.handleSessionRevocation === 'function') {
              global.handleSessionRevocation(result.error.code);
            }
          }
          const errMsg = (result && result.error) ? (result.error.message || result.error) : 'Upload error';
          currentQueue.forEach(function(q) {
            if (itemIdsToProcess.includes(q.syncId)) {
              q.status = 'FAILED';
              q.errorMessage = errMsg;
            }
          });
          self.saveQueue(currentQueue);
          if (callback) callback({ success: false, error: result ? result.error : { message: errMsg } });
        }
      })
      .catch(function(err) {
        console.warn("[SyncManager] Network error during upload:", err.message);
        const currentQueue = self.getQueue();
        currentQueue.forEach(function(q) {
          if (itemIdsToProcess.includes(q.syncId)) {
            q.status = 'FAILED';
            q.errorMessage = err.message;
          }
        });
        self.saveQueue(currentQueue);
        if (callback) callback({ success: false, error: { code: 'NETWORK_ERROR', message: err.message } });
      });
    },

    /**
     * Downloads cloud modifications since last synchronized timestamp.
     */
    downloadCloudDeltas: function(callback) {
      const lastSync = (typeof localStorage !== 'undefined') ? (localStorage.getItem(STORAGE_KEY_LAST_SYNC) || '1970-01-01T00:00:00Z') : '1970-01-01T00:00:00Z';
      const apiUrl = this.getApiUrl();

      let staffToken = null;
      try {
        const sessionStr = (typeof localStorage !== 'undefined') ? localStorage.getItem('itd3_staff_session') : null;
        if (sessionStr) {
          const sessionObj = JSON.parse(sessionStr);
          if (sessionObj && sessionObj.token) staffToken = sessionObj.token;
        }
      } catch (e) {}

      const downloadPayload = {
        action: 'sync_download',
        token: staffToken || undefined,
        apiKey: !staffToken ? this.getAdminKey() : undefined,
        schoolId: this.getSchoolId(),
        since: lastSync
      };

      fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(downloadPayload),
        redirect: 'follow'
      })
      .then(function(res) { return res.json(); })
      .then(function(result) {
        if (result && result.success) {
          if (callback) callback({ success: true, data: result.data });
        } else {
          if (result && result.error && (result.error.code === 'ACCOUNT_DEACTIVATED' || result.error.code === 'SESSION_EXPIRED')) {
            if (typeof global.handleSessionRevocation === 'function') {
              global.handleSessionRevocation(result.error.code);
            }
          }
          if (callback) callback({ success: false, error: result ? result.error : { message: 'Download failed' } });
        }
      })
      .catch(function(err) {
        console.warn("[SyncManager] Download network error:", err.message);
        if (callback) callback({ success: false, error: { code: 'NETWORK_ERROR', message: err.message } });
      });
    },

    /**
     * Safely merges downloaded cloud records into local storage without overwriting pending local edits.
     */
    mergeCloudData: function(cloudData) {
      if (!cloudData || typeof cloudData !== 'object') return;
      const queue = this.getQueue();
      const pendingEntityIds = new Set(queue.map(q => `${q.entity}_${q.entityId}`));

      try {
        // 1. Students
        if (Array.isArray(cloudData.students) && cloudData.students.length > 0) {
          let localStudents = JSON.parse(localStorage.getItem('itd3_s') || '[]');
          const localMap = new Map(localStudents.map(s => [String(s.id || s.studentId), s]));

          cloudData.students.forEach(function(cs) {
            const sid = String(cs.student_id || cs.studentId || cs.id);
            // Only update if not pending local edit
            if (!pendingEntityIds.has(`Students_${sid}`) && !pendingEntityIds.has(`Students_ALL_STUDENTS`)) {
              const existingStudent = localMap.get(sid) || {};
              const rawGroup = cs.group || cs.student_group || cs.group_name || cs.studentGroup || existingStudent.group || null;
              const group = (rawGroup !== undefined && rawGroup !== null && String(rawGroup).trim() !== '' && String(rawGroup).trim() !== 'null' && String(rawGroup).trim() !== 'undefined' && String(rawGroup).trim() !== 'Group Not Assigned') ? String(rawGroup).trim() : null;
              localMap.set(sid, {
                ...existingStudent,
                id: sid,
                studentId: sid,
                name: cs.student_name || cs.studentName || cs.name || existingStudent.name || '',
                roll: cs.roll_no || cs.rollNo || cs.roll || existingStudent.roll || '',
                class: String(cs.class || existingStudent.class || '9'),
                section: String(cs.section || existingStudent.section || 'A'),
                group: group,
                gender: cs.gender || existingStudent.gender || 'Male',
                dob: cs.dob || existingStudent.dob || '',
                father: cs.father_name || cs.fatherName || cs.father || existingStudent.father || '',
                mother: cs.mother_name || cs.motherName || cs.mother || existingStudent.mother || '',
                mobile: cs.mobile || existingStudent.mobile || '',
                aadhaar: cs.aadhaar || existingStudent.aadhaar || '',
                village: cs.village || existingStudent.village || '',
                status: cs.status || existingStudent.status || 'Active'
              });
            }
          });

          localStudents = Array.from(localMap.values());
          localStorage.setItem('itd3_s', JSON.stringify(localStudents));
          if (typeof global !== 'undefined' && typeof global.students !== 'undefined') global.students = localStudents;
          if (typeof window !== 'undefined') {
            window.students = localStudents;
            if (typeof window.renderStudents === 'function') window.renderStudents();
          }
        }

        // 2. Attendance
        if (Array.isArray(cloudData.attendance) && cloudData.attendance.length > 0) {
          let localAttendance = JSON.parse(localStorage.getItem('itd3_a') || '{}');
          if (!pendingEntityIds.has('Attendance_ALL_ATTENDANCE')) {
            cloudData.attendance.forEach(function(att) {
              const dateStr = att.date || att.session_date;
              const sid = String(att.student_id || att.studentId || att.id || '');
              if (dateStr && sid) {
                // Do not overwrite local data if this date has a pending sync
                if (pendingEntityIds.has(`Attendance_ATT_${dateStr}`)) return;
                if (!localAttendance[dateStr]) localAttendance[dateStr] = [];
                const status = (att.status || 'PRESENT').toUpperCase();
                if ((status === 'PRESENT' || status === 'LATE') && !localAttendance[dateStr].includes(sid)) {
                  localAttendance[dateStr].push(sid);
                } else if (status === 'ABSENT' && localAttendance[dateStr].includes(sid)) {
                  localAttendance[dateStr] = localAttendance[dateStr].filter(id => id !== sid);
                }
              }
            });
            localStorage.setItem('itd3_a', JSON.stringify(localAttendance));
            if (typeof global !== 'undefined' && typeof global.attendance !== 'undefined') global.attendance = localAttendance;
            if (typeof window !== 'undefined') {
              window.attendance = localAttendance;
              if (typeof window.renderTodayAttendance === 'function') window.renderTodayAttendance();
            }
          }
        }

        // 3. Marks
        if (Array.isArray(cloudData.marks) && cloudData.marks.length > 0) {
          let localMarks = JSON.parse(localStorage.getItem('itd3_m') || '{}');
          const examMap = { '1st Unit Test': '0', 'Half Yearly': '1', '2nd Unit Test': '2', 'Final Exam': '3' };

          if (!pendingEntityIds.has('Marks_ALL_MARKS')) {
            cloudData.marks.forEach(function(m) {
              const sid = String(m.student_id || m.studentId || m.id || '');
              const examIdx = examMap[m.exam_name || m.exam] || '0';
              if (sid) {
                if (!localMarks[sid]) localMarks[sid] = {};
                localMarks[sid][examIdx] = {
                  t: parseInt(m.theory_marks || m.theory) || 0,
                  p: parseInt(m.practical_marks || m.practical) || 0
                };
              }
            });
            localStorage.setItem('itd3_m', JSON.stringify(localMarks));
            if (typeof global.marks !== 'undefined') global.marks = localMarks;
          }
        }

        // 4. Notes
        if (Array.isArray(cloudData.notes) && cloudData.notes.length > 0) {
          let localNotes = JSON.parse(localStorage.getItem('itd3_notes') || '[]');
          const localMap = new Map(localNotes.map(n => [`${n.class}_${n.title}`, n]));

          cloudData.notes.forEach(function(cn) {
            const key = `${cn.class}_${cn.title}`;
            if (!pendingEntityIds.has(`TeacherNotes_${cn.noteId}`) && !pendingEntityIds.has('TeacherNotes_ALL_NOTES')) {
              localMap.set(key, {
                noteId: cn.noteId || cn.id || `NOT_${Date.now()}`,
                class: String(cn.class || '9'),
                title: cn.title || 'Main Book',
                subject: cn.subject || 'IT/ITeS',
                units: Array.isArray(cn.units) ? cn.units : [],
                updatedAt: cn.updatedAt || new Date().toISOString()
              });
            }
          });

          localNotes = Array.from(localMap.values());
          localStorage.setItem('itd3_notes', JSON.stringify(localNotes));
          if (typeof global !== 'undefined' && typeof global.studyNotes !== 'undefined') global.studyNotes = localNotes;
          if (typeof window !== 'undefined') {
            window.studyNotes = localNotes;
          }
        }

        // 5. Timetable
        if (Array.isArray(cloudData.timetable) && cloudData.timetable.length > 0) {
          if (!pendingEntityIds.has('Timetable_ALL_TIMETABLE')) {
            localStorage.setItem('itd3_timetable', JSON.stringify(cloudData.timetable));
            if (typeof window !== 'undefined') {
              window.timetable = cloudData.timetable;
            }
          }
        }

        // 6. Refresh active UI only
        if (typeof global.refreshAllUI === 'function') {
          global.refreshAllUI();
        }
      } catch (e) {
        console.error("[SyncManager] Error merging cloud data:", e);
      }
    },

    /**
     * Directly tests live production connectivity against the Cloudflare Worker.
     */
    testLiveConnection: function(callback) {
      const apiUrl = this.getApiUrl();
      const pingUrl = apiUrl.replace(/\/$/, '') + '/ping';
      const startTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const queue = this.getQueue();
      const pendingCount = queue.filter(q => q.status === 'PENDING' || q.status === 'FAILED').length;
      const lastSync = (typeof localStorage !== 'undefined') ? localStorage.getItem('itd3_last_sync') : null;

      let controller = null;
      let timeoutId = null;
      if (typeof AbortController !== 'undefined') {
        controller = new AbortController();
        timeoutId = setTimeout(function() { controller.abort(); }, 10000);
      }

      fetch(pingUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
        signal: controller ? controller.signal : undefined
      })
      .then(function(res) {
        if (timeoutId) clearTimeout(timeoutId);
        const durationMs = Math.round(((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - startTime);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json().then(function(data) {
          return { data: data, latency: durationMs };
        });
      })
      .then(function(result) {
        const payload = result.data;
        const info = {
          success: true,
          ok: true,
          isLive: true,
          status: payload?.data?.status || 'ONLINE',
          latencyMs: result.latency,
          schoolId: payload?.data?.schoolId || 'GAMERI-HSS-001',
          schoolName: payload?.data?.schoolName || 'Gameri Higher Secondary School, Gamiri',
          version: payload?.data?.version || payload?.data?.apiVersion || payload?.version || '6.0-CF-PROD',
          environment: payload?.data?.environment || 'production',
          lastSync: lastSync,
          pendingCount: pendingCount
        };
        if (callback) callback(info);
      })
      .catch(function(err) {
        if (timeoutId) clearTimeout(timeoutId);
        const durationMs = Math.round(((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()) - startTime);
        const isAbort = err.name === 'AbortError';
        const info = {
          success: false,
          ok: false,
          isLive: false,
          status: 'OFFLINE',
          latencyMs: durationMs,
          errorMessage: isAbort ? 'Connection timed out (10s)' : (err.message || 'Connection timeout or network unavailable'),
          lastSync: lastSync,
          pendingCount: pendingCount
        };
        if (callback) callback(info);
      });
    },

    /**
     * Notifies UI listeners of sync status changes.
     */
    notifyStatusChange: function(state, errorMsg, timeStr) {
      const queue = this.getQueue();
      const pendingCount = queue.filter(function(q) { return q.status === 'PENDING' || q.status === 'FAILED'; }).length;
      const lastSync = (typeof localStorage !== 'undefined') ? localStorage.getItem('itd3_last_sync') : null;
      const isOnline = this.isOnline();

      let effectiveState = state;
      if (!effectiveState) {
        if (this.isSyncing) effectiveState = 'SYNCING';
        else if (!isOnline) effectiveState = 'OFFLINE';
        else if (pendingCount > 0) effectiveState = 'PENDING';
        else if (lastSync) effectiveState = 'SYNCED';
        else effectiveState = 'CONNECTED';
      }

      this.lastSyncStatus = effectiveState;

      const statusInfo = {
        state: effectiveState,
        pendingCount: pendingCount,
        lastSync: lastSync,
        errorMessage: errorMsg || null,
        isOnline: isOnline
      };

      if (typeof this.statusListener === 'function') {
        try {
          this.statusListener(statusInfo);
        } catch (e) {}
      }

      // Update UI elements in DOM
      if (typeof document !== 'undefined') {
        const topSyncStatus = document.getElementById('sync-status');
        const backupBadge = document.getElementById('backup-health-badge');
        const backupStatusText = document.getElementById('backup-status-text');
        const backupTimestampText = document.getElementById('backup-timestamp-text');

        if (backupTimestampText && lastSync) {
          backupTimestampText.innerText = lastSync;
        }

        if (topSyncStatus) {
          topSyncStatus.style.display = 'inline-block';
          if (effectiveState === 'SYNCING') {
            topSyncStatus.innerText = '⚡ Syncing...';
            topSyncStatus.style.color = 'var(--accent-teal)';
          } else if (effectiveState === 'OFFLINE' || !isOnline) {
            topSyncStatus.innerText = pendingCount > 0 ? `📴 Offline (${pendingCount})` : '📴 Offline';
            topSyncStatus.style.color = 'var(--accent-amber)';
          } else if (effectiveState === 'ERROR') {
            topSyncStatus.innerText = '⚠️ Sync Error';
            topSyncStatus.style.color = 'var(--accent-red)';
          } else if (pendingCount > 0) {
            topSyncStatus.innerText = `⏳ ${pendingCount} Pending`;
            topSyncStatus.style.color = 'var(--accent-amber)';
          } else if (effectiveState === 'SYNCED' || lastSync) {
            topSyncStatus.innerText = `✓ Synced${timeStr ? ' (' + timeStr + ')' : ''}`;
            topSyncStatus.style.color = '#2ecc71';
          } else {
            topSyncStatus.innerText = '☁ Connected';
            topSyncStatus.style.color = 'var(--text-dim)';
          }
        }

        if (backupBadge) {
          if (effectiveState === 'SYNCING') {
            backupBadge.innerText = '⚡ Syncing';
            backupBadge.style.background = 'rgba(0, 242, 254, 0.2)';
            backupBadge.style.color = 'var(--accent-teal)';
          } else if (effectiveState === 'OFFLINE' || !isOnline) {
            backupBadge.innerText = 'Offline Mode';
            backupBadge.style.background = 'rgba(248, 155, 41, 0.2)';
            backupBadge.style.color = 'var(--accent-amber)';
          } else if (effectiveState === 'ERROR') {
            backupBadge.innerText = 'Sync Error';
            backupBadge.style.background = 'rgba(255, 107, 107, 0.2)';
            backupBadge.style.color = 'var(--accent-red)';
          } else {
            backupBadge.innerText = '✓ Cloud Synced';
            backupBadge.style.background = 'rgba(46, 204, 113, 0.2)';
            backupBadge.style.color = '#2ecc71';
          }
        }

        if (backupStatusText) {
          if (effectiveState === 'SYNCING') backupStatusText.innerText = 'Synchronizing with School Cloud...';
          else if (!isOnline) backupStatusText.innerText = 'Offline — Local Storage Active (Pending Sync)';
          else if (effectiveState === 'ERROR') backupStatusText.innerText = 'Sync Error — Retrying automatically...';
          else backupStatusText.innerText = '✓ Auto Sync Active with School Cloud (Cloudflare Edge)';
        }
      }
    },

    /**
     * Handles network reconnection.
     */
    onNetworkAvailable: function() {
      console.log("[SyncManager] Internet connection restored.");
      this.notifyStatusChange('CONNECTED');
      const queue = this.getQueue();
      const hasPending = queue.some(function(item) {
        return item.status === 'PENDING' || (item.status === 'FAILED' && item.attemptCount < MAX_RETRY_ATTEMPTS);
      });
      if (hasPending) {
        this.triggerAutoSync(false);
      }
    },

    /**
     * Initializes SyncManager event listeners on app startup.
     */
    init: function() {
      const self = this;
      if (typeof window !== 'undefined') {
        window.addEventListener('online', function() {
          self.onNetworkAvailable();
        });
        window.addEventListener('offline', function() {
          self.notifyStatusChange('OFFLINE');
        });
      }

      this.notifyStatusChange();
    }
  };

  if (typeof window !== 'undefined') {
    window.SyncManager = SyncManager;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SyncManager };
  }

})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
