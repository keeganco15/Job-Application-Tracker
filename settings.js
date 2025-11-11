 // Load saved settings
 document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get([
      'enableNotifications',
      'darkMode',
      'showAllColumns'
    ], (result) => {
      document.getElementById('toggle-notifications').checked = result.enableNotifications || false;
      document.getElementById('toggle-darkmode').checked = result.darkMode || false;
      document.getElementById('toggle-columns').checked = result.showAllColumns || true;
    });

    // Toggle handlers
    document.getElementById('toggle-notifications').addEventListener('change', (e) => {
      chrome.storage.local.set({ enableNotifications: e.target.checked });
    });

    document.getElementById('toggle-darkmode').addEventListener('change', (e) => {
      chrome.storage.local.set({ darkMode: e.target.checked });
    });

    document.getElementById('toggle-columns').addEventListener('change', (e) => {
      chrome.storage.local.set({ showAllColumns: e.target.checked });
    });

    // Export job list
    document.getElementById('export-jobs').addEventListener('click', () => {
      chrome.storage.local.get(['jobApplications'], (result) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result.jobApplications || [], null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "job_applications.json");
        downloadAnchor.click();
      });
    });

    // Reset dashboard
    document.getElementById('reset-dashboard').addEventListener('click', () => {
      if (confirm("Are you sure you want to reset the dashboard and delete all tracked jobs?")) {
        chrome.storage.local.remove(['jobApplications'], () => {
          alert('Dashboard reset.');
        });
      }
    });
  });