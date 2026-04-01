# Job Track

A Chrome extension for tracking job applications while you browse. No accounts, no backend, everything is stored locally in your browser.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green?style=for-the-badge)
![HTML](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

---

## Features

- Track job title, company, location, salary, status, and notes
- Filter applications by status (Applied, Interview, Offer, Rejected, Withdrawn)
- Search across all fields
- Sort by date, company, or status
- Star favourite applications
- Edit or delete entries at any time
- Response rate stats at a glance
- Data stays on your device, nothing is sent anywhere

## Tech stack

- HTML, CSS, JavaScript (no frameworks)
- Chrome Extension Manifest V3
- Chrome Storage API

## Installation

This extension isn't on the Chrome Web Store, so you'll need to load it manually.

1. Clone the repo:
   ```
   git clone https://github.com/keeganco15/Job-Application-Tracker.git
   ```

2. Open Chrome and go to `chrome://extensions`

3. Enable **Developer mode** (toggle in the top right)

4. Click **Load unpacked** and select the project folder

5. The Job Track icon will appear in your toolbar

## Project structure

```
Job-Application-Tracker/
├── pages/
│   ├── addJob.html
│   ├── dashboard.html
│   └── popup.html
├── resources/
│   ├── favicon.ico
│   └── icon.png
├── scripts/
│   ├── dashboard.js
│   └── popup.js
├── styles/
│   ├── account.css
│   ├── dashboard.css
│   ├── popup.css
│   └── settings.css
├── content.js
├── manifest.json
└── README.md
```

## Usage

Click the "Apply" button on Indeed or LinkedIn job postings to save job details.

Click the Job Track icon in your Chrome toolbar to open the pop-up. From there, you can open the dashboard:

- Click **Add Job** to log a new application
- Click any row in the dashboard to expand notes
- Use the sidebar to filter by status
- Use the search bar and sort dropdown to find applications

## Roadmap

- [ ] Export to CSV
- [ ] Follow-up reminders
- [ ] Backend implementation

## License

MIT
