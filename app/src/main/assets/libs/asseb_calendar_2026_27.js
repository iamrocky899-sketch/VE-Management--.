/**
 * ASSEB Academic Calendar 2026–27 Dataset & Unified Attendance Engine
 * Source: Assam State School Education Board, Division-I
 * School: Gameri Higher Secondary School, Gamiri
 * Academic Session: 2026-27 (April 1, 2026 to March 31, 2027)
 * Total Days: 365 | Official Working Days: 254
 */

(function(global) {
    'use strict';

    const ASSEB_CALENDAR_DAYS = [
    {
        "date": "2026-04-01",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-02",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [
            "World Autism Awareness Day"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-03",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Good Friday",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-04",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-05",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-06",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-07",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [
            "World Health Day"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-08",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-09",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-10",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-11",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-12",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-13",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-14",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Bohag Bihu",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-15",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Bohag Bihu",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-16",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Bohag Bihu",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-17",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-18",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Tithi of Damodardeva",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-19",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-20",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-21",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sati Sadhani Divas",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-22",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [
            "Earth Day"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-23",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-24",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-25",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [
            "World Malaria Day"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-26",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-27",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-28",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-29",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-04-30",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-01",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "May Day / Buddha Purnima",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-02",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-03",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-04",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-05",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-06",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-07",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-08",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-09",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [
            "Rabindra Jayanti"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-10",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-11",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [
            "Science and Technology Day"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-12",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-13",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-14",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-15",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-16",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-17",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-18",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-19",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-20",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-21",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-22",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-23",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-24",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-25",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-26",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-27",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Id-ul-Zuha",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-28",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [
            "Menstrual Hygiene Day"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-29",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-30",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-05-31",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [
            "World No Tobacco Day"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-01",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Janmashtami of Sri Sri Madhabdeva",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-02",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-03",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-04",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-05",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [
            "World Environment Day"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-06",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-07",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-08",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-09",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-10",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-11",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-12",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-13",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-14",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-15",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-16",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-17",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-18",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-19",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-20",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [
            "Bishnu Rabha Divas"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-21",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [
            "International Yoga Day"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-22",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Unit Test-1",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-23",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Unit Test-1",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-24",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Unit Test-1",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-25",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Unit Test-1",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-26",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Unit Test-1",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-27",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Unit Test-1",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-28",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-29",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-06-30",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-01",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-02",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-03",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-04",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-05",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Sunday / Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-06",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-07",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-08",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-09",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-10",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-11",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-12",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Sunday / Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-13",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-14",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-15",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-16",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-17",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-18",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-19",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Sunday / Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-20",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-21",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-22",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-23",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-24",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-25",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-26",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Sunday / Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-27",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-28",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-29",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-30",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-07-31",
        "academicSession": "2026-27",
        "officialStatus": "VACATION",
        "title": "Summer Vacation",
        "description": "ASSEB Official Summer Vacation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-01",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-02",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-03",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-04",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-05",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-06",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-07",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-08",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-09",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-10",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-11",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-12",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-13",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-14",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-15",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Independence Day",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-16",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-17",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-18",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-19",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-20",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-21",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-22",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-23",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-24",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-25",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-26",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-27",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-28",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-29",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-30",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-08-31",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-01",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Tirubhav Tithi of Sri Sri Madhabdeva",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-02",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-03",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-04",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Janmashtami",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-05",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [
            "Teachers' Day"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-06",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-07",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-08",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [
            "World Literacy Day"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-09",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-10",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-11",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-12",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Tithi of Srimanta Sankardeva",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-13",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-14",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-15",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-16",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-17",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-18",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-19",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-20",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-21",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Janmashtami of Sri Sri Sankardeva",
        "description": "ASSEB Official Holiday",
        "observations": [
            "World Peace Day"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-22",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Karam Puja",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-23",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-24",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Half Yearly Examination",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-25",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Half Yearly Examination",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-26",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Half Yearly Examination",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-27",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-28",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Half Yearly Examination",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-29",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Half Yearly Examination",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-09-30",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Half Yearly Examination",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-01",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-02",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Birth Day of Mahatma Gandhi",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-03",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-04",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-05",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-06",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-07",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-08",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-09",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-10",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [
            "World Mental Health Day"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-11",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-12",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-13",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [
            "World Disaster Day"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-14",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-15",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [
            "World Handwashing Day / World Students Day"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-16",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-17",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-18",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Kali Puja & Durga Puja / Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-19",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Durga Puja",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-20",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Durga Puja",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-21",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Vijaya Dashami",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-22",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": "Except Barak Valley",
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-23",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": "Except Barak Valley",
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-24",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": "Except Barak Valley",
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-25",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Lakhi Puja / Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-26",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": "Except Barak Valley",
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-27",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-28",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-29",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-30",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-10-31",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [
            "Rashtriya Ekta Divas"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-01",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-02",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-03",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-04",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-05",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [
            "Death Anniversary of Dr. Bhupen Hazarika"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-06",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-07",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-08",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Kali Puja & Diwali / Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-09",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-10",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-11",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Bhatridwitiya / National Education Day",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-12",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-13",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-14",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [
            "Children's Day"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-15",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Chhath Puja / Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-16",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-17",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-18",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-19",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [
            "World Sanitation Day"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-20",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-21",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-22",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-23",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Unit Test-2",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-24",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Guru Nanak's Birthday / Lachit Divas",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-25",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Unit Test-2",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-26",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Unit Test-2",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-27",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Unit Test-2",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-28",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Unit Test-2",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-29",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-11-30",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Unit Test-2",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-01",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [
            "World AIDS Day"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-02",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Asom Divas",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-03",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [
            "International Day of Disabled Persons"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-04",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-05",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-06",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-07",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-08",
        "academicSession": "2026-27",
        "officialStatus": "ACTIVITY",
        "title": "Annual Sports",
        "description": "ASSEB Official School Activity / Event",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-09",
        "academicSession": "2026-27",
        "officialStatus": "ACTIVITY",
        "title": "Annual Sports",
        "description": "ASSEB Official School Activity / Event",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-10",
        "academicSession": "2026-27",
        "officialStatus": "ACTIVITY",
        "title": "Annual Sports",
        "description": "ASSEB Official School Activity / Event",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-11",
        "academicSession": "2026-27",
        "officialStatus": "ACTIVITY",
        "title": "Cultural and Literary activities",
        "description": "ASSEB Official School Activity / Event",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-12",
        "academicSession": "2026-27",
        "officialStatus": "ACTIVITY",
        "title": "Cultural & Literary activities / Prize Distribution",
        "description": "ASSEB Official School Activity / Event",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-13",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-14",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-15",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-16",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-17",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-18",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-19",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-20",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-21",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-22",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [
            "National Mathematics Day"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-23",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-24",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-25",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Christmas Day",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-26",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-27",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-28",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-29",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-30",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2026-12-31",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-01",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-02",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Revisionary Exam / Revisionary activities",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-03",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-04",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Revisionary Exam / Revisionary activities",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-05",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Revisionary Exam / Revisionary activities",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-06",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Revisionary Exam / Revisionary activities",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-07",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Revisionary Exam / Revisionary activities",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-08",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Revisionary Exam / Revisionary activities",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-09",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Revisionary Exam / Revisionary activities",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-10",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-11",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Practical Exam / Revisionary Exam",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-12",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-13",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-14",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Magh Bihu",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-15",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Magh Bihu & Tusu Puja",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-16",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-17",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Silpi Divas / Sunday",
        "description": "Weekly Holiday",
        "observations": [
            "Silpi Divas"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-18",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-19",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-20",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-21",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-22",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-23",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Netaji's Birthday",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-24",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "World Girl Child Day / Sunday",
        "description": "Weekly Holiday",
        "observations": [
            "World Girl Child Day"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-25",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-26",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Republic Day",
        "description": "ASSEB Official Holiday",
        "observations": [
            "Republic Day"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-27",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-28",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-29",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-30",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-01-31",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-02-01",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-02-02",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-02-03",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-02-04",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-02-05",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-02-06",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-02-07",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-02-08",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-02-09",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-02-10",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-02-11",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [
            "Saraswati Puja"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-02-12",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-02-13",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-02-14",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-02-15",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-02-16",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-02-17",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Ali Aye Ligang",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-02-18",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-02-19",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-02-20",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Bir Chilarai Divas",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-02-21",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [
            "International Mother Language Day"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-02-22",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-02-23",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-02-24",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-02-25",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-02-26",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-02-27",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-02-28",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [
            "National Science Day"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-01",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-02",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-03",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-04",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [
            "Child Protection Day"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-05",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-06",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Annual Exam for Class IX",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-07",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-08",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Annual Exam for Class IX",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-09",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Id-ul-Fitr",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-10",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Annual Exam for Class IX",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-11",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Annual Exam for Class IX",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-12",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Annual Exam for Class IX",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-13",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Annual Exam for Class IX",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-14",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-15",
        "academicSession": "2026-27",
        "officialStatus": "EXAMINATION",
        "title": "Practical of Annual Examination",
        "description": "ASSEB Official Examination / Evaluation",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-16",
        "academicSession": "2026-27",
        "officialStatus": "CLASS",
        "title": "Class Day",
        "description": "",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-17",
        "academicSession": "2026-27",
        "officialStatus": "ACTIVITY",
        "title": "Evaluation",
        "description": "ASSEB Official School Activity / Event",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-18",
        "academicSession": "2026-27",
        "officialStatus": "ACTIVITY",
        "title": "Evaluation",
        "description": "ASSEB Official School Activity / Event",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-19",
        "academicSession": "2026-27",
        "officialStatus": "ACTIVITY",
        "title": "Evaluation",
        "description": "ASSEB Official School Activity / Event",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-20",
        "academicSession": "2026-27",
        "officialStatus": "ACTIVITY",
        "title": "Evaluation",
        "description": "ASSEB Official School Activity / Event",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-21",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-22",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Holi / World Water Day",
        "description": "ASSEB Official Holiday",
        "observations": [
            "World Water Day"
        ],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-23",
        "academicSession": "2026-27",
        "officialStatus": "ACTIVITY",
        "title": "Evaluation",
        "description": "ASSEB Official School Activity / Event",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-24",
        "academicSession": "2026-27",
        "officialStatus": "ACTIVITY",
        "title": "Evaluation",
        "description": "ASSEB Official School Activity / Event",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-25",
        "academicSession": "2026-27",
        "officialStatus": "ACTIVITY",
        "title": "Evaluation",
        "description": "ASSEB Official School Activity / Event",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-26",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Good Friday",
        "description": "ASSEB Official Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-27",
        "academicSession": "2026-27",
        "officialStatus": "ACTIVITY",
        "title": "Declaration of Results of Class IX",
        "description": "ASSEB Official School Activity / Event",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-28",
        "academicSession": "2026-27",
        "officialStatus": "HOLIDAY",
        "title": "Sunday",
        "description": "Weekly Holiday",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-29",
        "academicSession": "2026-27",
        "officialStatus": "ACTIVITY",
        "title": "Analysis of Annual Exam Results",
        "description": "ASSEB Official School Activity / Event",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-30",
        "academicSession": "2026-27",
        "officialStatus": "ACTIVITY",
        "title": "Formation of School Routine for 2027–28",
        "description": "ASSEB Official School Activity / Event",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    },
    {
        "date": "2027-03-31",
        "academicSession": "2026-27",
        "officialStatus": "ACTIVITY",
        "title": "Formation of School Routine for 2027–28",
        "description": "ASSEB Official School Activity / Event",
        "observations": [],
        "note": null,
        "attendanceEligible": null,
        "source": "ASSEB Academic Calendar 2026-27",
        "sourcePage": null,
        "official": true
    }
];

    // Map by Date for O(1) Lookup
    const ASSEB_CALENDAR_MAP = {};
    ASSEB_CALENDAR_DAYS.forEach(function(item) {
        ASSEB_CALENDAR_MAP[item.date] = item;
    });

    const ASSEB_MONTH_TOTALS = {
    "2026-04": 20,
    "2026-05": 24,
    "2026-06": 25,
    "2026-07": 0,
    "2026-08": 25,
    "2026-09": 21,
    "2026-10": 23,
    "2026-11": 23,
    "2026-12": 25,
    "2027-01": 22,
    "2027-02": 22,
    "2027-03": 24
};

    /**
     * Get the official ASSEB calendar entry for any date.
     * @param {string} dateStr - 'YYYY-MM-DD'
     * @returns {Object} Official calendar entry
     */
    function getOfficialCalendarStatus(dateStr) {
        if (!dateStr) return null;
        const entry = ASSEB_CALENDAR_MAP[dateStr];
        if (entry) {
            const isOfficialWorking = (entry.officialStatus === 'CLASS' || entry.officialStatus === 'EXAMINATION' || entry.officialStatus === 'ACTIVITY');
            return {
                date: entry.date,
                academicSession: entry.academicSession,
                officialStatus: entry.officialStatus,
                title: entry.title,
                description: entry.description,
                observations: entry.observations || [],
                note: entry.note || null,
                isOfficialWorking: isOfficialWorking,
                official: true,
                source: entry.source
            };
        }
        // Fallback for dates outside 2026-27 session
        const dObj = new Date(dateStr + 'T00:00:00');
        const isSun = dObj.getDay() === 0;
        return {
            date: dateStr,
            academicSession: 'Unknown',
            officialStatus: isSun ? 'HOLIDAY' : 'CLASS',
            title: isSun ? 'Sunday' : 'Class Day',
            description: 'Outside 2026-27 ASSEB Session',
            observations: [],
            note: null,
            isOfficialWorking: !isSun,
            official: false,
            source: 'Default Fallback'
        };
    }

    /**
     * Centralized Attendance Day State & Policy Engine
     * Evaluates final attendance eligibility and day status by applying:
     * 1. Teacher Class Not Held / Holiday / Working Day override (itd3_day_status / itd3_cnh) -> Highest Priority
     * 2. Official ASSEB Calendar Status (HOLIDAY, VACATION, EXAMINATION, ACTIVITY, CLASS)
     * 3. Class-specific weekend policy & Special Saturday Academic/Exam Exception:
     *    - Sunday: All classes OFF
     *    - Saturday Examination / Activity Exception: If official status is EXAMINATION or ACTIVITY, Saturday is attendance-eligible for ALL classes (including IX-X)
     *    - Normal Saturday: Class IX–X OFF, Class XI–XII WORKING
     * 4. Final attendance eligibility
     *
     * @param {string} dateStr - 'YYYY-MM-DD'
     * @param {string} classNum - '9', '10', '11', '12' or 'All'
     * @param {Object} [teacherOverrides] - Optional dayStatusOverrides object
     * @param {Object} [cnhRegister] - Optional classNotHeld object
     * @returns {Object} { status, reason, isWorking, attendanceEligible, officialStatus, title, observations, note }
     */
    function evaluateAttendanceEligibility(dateStr, classNum, teacherOverrides, cnhRegister) {
        if (!dateStr) {
            return { status: 'WORKING_DAY', reason: 'Working Day', isWorking: true, attendanceEligible: true, officialStatus: 'CLASS' };
        }

        classNum = String(classNum || '9');
        const dateObj = new Date(dateStr + 'T00:00:00');
        const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 6 = Saturday

        // 1. Priority 1: Teacher Manual Day Override
        if (teacherOverrides) {
            const manualEntry = teacherOverrides[dateStr]?.[classNum] || teacherOverrides[dateStr]?.['All'];
            if (manualEntry) {
                if (manualEntry.status === 'HOLIDAY') {
                    return {
                        status: 'HOLIDAY',
                        reason: manualEntry.reason || 'Teacher Marked Holiday',
                        isWorking: false,
                        attendanceEligible: false,
                        officialStatus: 'TEACHER_OVERRIDE_HOLIDAY'
                    };
                }
                if (manualEntry.status === 'CLASS_NOT_HELD') {
                    return {
                        status: 'CLASS_NOT_HELD',
                        reason: manualEntry.reason || 'Class Not Held',
                        isWorking: false,
                        attendanceEligible: false,
                        officialStatus: 'TEACHER_OVERRIDE_CNH'
                    };
                }
                if (manualEntry.status === 'WORKING_DAY') {
                    return {
                        status: 'WORKING_DAY',
                        reason: manualEntry.reason || 'Teacher Marked Working Day',
                        isWorking: true,
                        attendanceEligible: true,
                        officialStatus: 'TEACHER_OVERRIDE_WORKING'
                    };
                }
            }
        }

        // 1b. Priority 1b: Legacy Class Not Held register
        if (cnhRegister && cnhRegister[dateStr] && cnhRegister[dateStr][classNum]) {
            const reason = cnhRegister[dateStr][classNum];
            if (typeof reason === 'string' && reason.toLowerCase() === 'holiday') {
                return {
                    status: 'HOLIDAY',
                    reason: 'Holiday (' + reason + ')',
                    isWorking: false,
                    attendanceEligible: false,
                    officialStatus: 'CNH_HOLIDAY'
                };
            }
            return {
                status: 'CLASS_NOT_HELD',
                reason: reason || 'Class Not Held',
                isWorking: false,
                attendanceEligible: false,
                officialStatus: 'CNH'
            };
        }

        // 2. Priority 2: Official ASSEB Academic Calendar
        const official = getOfficialCalendarStatus(dateStr);

        // Vacation (e.g. Summer Vacation in July) -> Always Non-working
        if (official.officialStatus === 'VACATION') {
            return {
                status: 'HOLIDAY',
                reason: official.title,
                isWorking: false,
                attendanceEligible: false,
                officialStatus: 'VACATION',
                title: official.title,
                observations: official.observations
            };
        }

        // Official Holiday (e.g. Good Friday, Bihu, Independence Day, Sunday) -> Always Non-working
        if (official.officialStatus === 'HOLIDAY') {
            return {
                status: (dayOfWeek === 0) ? 'WEEKEND' : 'HOLIDAY',
                reason: official.title,
                isWorking: false,
                attendanceEligible: false,
                officialStatus: 'HOLIDAY',
                title: official.title,
                observations: official.observations
            };
        }

        // 3. Priority 3: Sunday & Saturday Policy
        // Sunday: Non-working for ALL classes
        if (dayOfWeek === 0) {
            return {
                status: 'WEEKEND',
                reason: 'Sunday Off',
                isWorking: false,
                attendanceEligible: false,
                officialStatus: official.officialStatus,
                title: official.title,
                observations: official.observations
            };
        }

        // Saturday Policy:
        if (dayOfWeek === 6) {
            // SPECIAL SATURDAY EXCEPTION (RULE 3 & RULE 19):
            // If official calendar marks Saturday as EXAMINATION or ACTIVITY, it is attendance-eligible for ALL classes (including IX-X)
            if (official.officialStatus === 'EXAMINATION' || official.officialStatus === 'ACTIVITY') {
                return {
                    status: 'WORKING_DAY',
                    reason: official.title,
                    isWorking: true,
                    attendanceEligible: true,
                    officialStatus: official.officialStatus,
                    title: official.title,
                    observations: official.observations
                };
            }

            // Normal Saturday Policy (officialStatus === 'CLASS'):
            if (classNum === '9' || classNum === '10' || classNum === 'IX' || classNum === 'X') {
                return {
                    status: 'WEEKEND',
                    reason: 'Saturday Off (Class IX-X)',
                    isWorking: false,
                    attendanceEligible: false,
                    officialStatus: official.officialStatus,
                    title: official.title,
                    observations: official.observations
                };
            }
            // Class XI–XII: Saturday is WORKING
        }

        // 4. Priority 4: Final Attendance Eligibility for Official Class / Examination / Activity
        if (official.officialStatus === 'EXAMINATION') {
            return {
                status: 'WORKING_DAY',
                reason: official.title,
                isWorking: true,
                attendanceEligible: true,
                officialStatus: 'EXAMINATION',
                title: official.title,
                observations: official.observations
            };
        }

        if (official.officialStatus === 'ACTIVITY') {
            return {
                status: 'WORKING_DAY',
                reason: official.title,
                isWorking: true,
                attendanceEligible: true,
                officialStatus: 'ACTIVITY',
                title: official.title,
                observations: official.observations
            };
        }

        return {
            status: 'WORKING_DAY',
            reason: official.title || 'Working Day',
            isWorking: true,
            attendanceEligible: true,
            officialStatus: 'CLASS',
            title: official.title,
            observations: official.observations,
            note: official.note
        };
    }

    /**
     * Unified Attendance Day State Function
     * Alias for evaluateAttendanceEligibility for unified API usage across all features.
     */
    function getAttendanceDayState(dateStr, classNum, section, teacherOverrides, cnhRegister) {
        return evaluateAttendanceEligibility(dateStr, classNum, teacherOverrides, cnhRegister);
    }

    /**
     * Unified Student Attendance State Resolution
     * Resolves individual student attendance state for a date.
     *
     * @param {string} dateStr - 'YYYY-MM-DD'
     * @param {string} classNum - '9', '10', '11', '12'
     * @param {string} studentId - Student identifier
     * @param {Object} attendanceMap - attendance object { [dateStr]: [studentId, ...] }
     * @param {Function|Object} isRecordedCheck - isClassAttendanceRecorded function or recorded map
     * @param {Object} [teacherOverrides] - dayStatusOverrides object
     * @param {Object} [cnhRegister] - classNotHeld object
     * @returns {Object} { code, label, status, isWorking, attendanceEligible, isPresent, isPending, isCountedAbsent }
     */
    function getStudentAttendanceState(dateStr, classNum, studentId, attendanceMap, isRecordedCheck, teacherOverrides, cnhRegister) {
        const dayStat = evaluateAttendanceEligibility(dateStr, classNum, teacherOverrides, cnhRegister);
        if (!dayStat.isWorking || !dayStat.attendanceEligible) {
            return {
                code: '—',
                label: dayStat.reason,
                status: dayStat.status,
                isWorking: false,
                attendanceEligible: false,
                isPresent: false,
                isPending: false,
                isCountedAbsent: false
            };
        }

        let wasRecorded = false;
        if (typeof isRecordedCheck === 'function') {
            wasRecorded = isRecordedCheck(dateStr, classNum);
        } else if (isRecordedCheck && typeof isRecordedCheck === 'object') {
            wasRecorded = !!(isRecordedCheck[dateStr]?.[classNum] || (attendanceMap && attendanceMap[dateStr] !== undefined));
        } else if (attendanceMap) {
            wasRecorded = attendanceMap[dateStr] !== undefined;
        }

        // Attendance Pending (Rule 9): Never counted as absent!
        if (!wasRecorded) {
            return {
                code: '—',
                label: 'Attendance Pending',
                status: 'ATTENDANCE_PENDING',
                isWorking: true,
                attendanceEligible: true,
                isPresent: false,
                isPending: true,
                isCountedAbsent: false
            };
        }

        const isPresent = !!(attendanceMap && attendanceMap[dateStr] && attendanceMap[dateStr].includes(studentId));
        if (isPresent) {
            return {
                code: 'P',
                label: 'Present',
                status: 'PRESENT',
                isWorking: true,
                attendanceEligible: true,
                isPresent: true,
                isPending: false,
                isCountedAbsent: false
            };
        } else {
            return {
                code: 'A',
                label: 'Absent',
                status: 'ABSENT',
                isWorking: true,
                attendanceEligible: true,
                isPresent: false,
                isPending: false,
                isCountedAbsent: true
            };
        }
    }

    /**
     * Unified Consecutive Absence Calculation Engine (Rule 14 & Rule 16)
     * Calculates active consecutive absence streak considering only attendance-eligible dates where attendance was recorded.
     * Non-working days (holidays, Sundays, normal Saturdays for IX-X, vacation, CNH) do NOT count as absent and reset active streak.
     * Pending attendance does not increase streak and does not count as absent.
     *
     * @param {string} studentId
     * @param {string} classNum
     * @param {Object} attendanceMap
     * @param {Function|Object} isRecordedCheck
     * @param {Object} teacherOverrides
     * @param {Object} cnhRegister
     * @param {Array<string>} sortedDates
     * @returns {Object} { consecutiveAbsences, absenceDates, detailedBreakdown }
     */
    function calculateStudentConsecutiveAbsences(studentId, classNum, attendanceMap, isRecordedCheck, teacherOverrides, cnhRegister, sortedDates) {
        let consecutiveAbsences = 0;
        let absenceDates = [];
        let detailedBreakdown = [];

        if (!sortedDates || !Array.isArray(sortedDates)) {
            const allDatesSet = new Set(Object.keys(attendanceMap || {}));
            const today = new Date();
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            allDatesSet.add(todayStr);
            sortedDates = Array.from(allDatesSet).sort();
        }

        sortedDates.forEach(d => {
            const dayStat = evaluateAttendanceEligibility(d, classNum, teacherOverrides, cnhRegister);
            if (!dayStat.isWorking || !dayStat.attendanceEligible) {
                // Non-working day (Holiday, Sunday, Vacation, CNH, Weekend Off): Resets continuous streak
                if (consecutiveAbsences > 0) {
                    detailedBreakdown.push({ date: d, status: dayStat.status, reason: dayStat.reason, counted: false });
                }
                consecutiveAbsences = 0;
                absenceDates = [];
                return;
            }

            let wasRecorded = false;
            if (typeof isRecordedCheck === 'function') {
                wasRecorded = isRecordedCheck(d, classNum);
            } else if (isRecordedCheck && typeof isRecordedCheck === 'object') {
                wasRecorded = !!(isRecordedCheck[d]?.[classNum] || (attendanceMap && attendanceMap[d] !== undefined));
            } else if (attendanceMap) {
                wasRecorded = attendanceMap[d] !== undefined;
            }

            // Attendance Pending: does not count as absent, leaves previous streak intact
            if (!wasRecorded) {
                return;
            }

            const isPresent = !!(attendanceMap && attendanceMap[d] && attendanceMap[d].includes(studentId));
            if (isPresent) {
                consecutiveAbsences = 0;
                absenceDates = [];
                detailedBreakdown = [];
            } else {
                consecutiveAbsences++;
                absenceDates.push(d);
                detailedBreakdown.push({ date: d, status: 'WORKING_DAY', reason: 'Absent on held class', counted: true });
            }
        });

        return {
            consecutiveAbsences: consecutiveAbsences,
            absenceDates: absenceDates,
            detailedBreakdown: detailedBreakdown
        };
    }

    // Export module to global scope
    global.ASSEB_CALENDAR_DAYS = ASSEB_CALENDAR_DAYS;
    global.ASSEB_CALENDAR_MAP = ASSEB_CALENDAR_MAP;
    global.ASSEB_MONTH_TOTALS = ASSEB_MONTH_TOTALS;
    global.getOfficialCalendarStatus = getOfficialCalendarStatus;
    global.evaluateAttendanceEligibility = evaluateAttendanceEligibility;
    global.getAttendanceDayState = getAttendanceDayState;
    global.getStudentAttendanceState = getStudentAttendanceState;
    global.calculateStudentConsecutiveAbsences = calculateStudentConsecutiveAbsences;

})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
