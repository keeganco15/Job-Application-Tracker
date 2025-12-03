document.addEventListener('DOMContentLoaded', () => {
  const jobList = document.getElementById('recent-job-list');

  chrome.storage.local.get(['jobApplications'], (result) => {
    const jobs = (result.jobApplications || []).slice(-5).reverse(); // Show last 5
    if (jobs.length === 0) {
      jobList.innerHTML = `<li>No recent jobs</li>`;
      return;
    }

    jobs.forEach((job, index) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${job.jobTitle || 'Untitled'}</span>
        <button class="delete-btn" title="Delete job">🗑️</button>
      `;

      li.querySelector('.delete-btn').addEventListener('click', () => {
        chrome.storage.local.get(['jobApplications'], (res) => {
          const updated = (res.jobApplications || []).filter((_, i) => i !== (res.jobApplications.length - 1 - index));
          chrome.storage.local.set({ jobApplications: updated }, () => {
            li.remove();
          });
        });
      });

      jobList.appendChild(li);
    });
  });

  document.getElementById('dashboard-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  });

  document.getElementById('settings-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html#settings') });
  });

  document.getElementById('upgrade-btn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://your-upgrade-page.com' });
  });
});
