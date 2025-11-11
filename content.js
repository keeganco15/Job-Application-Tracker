//popup message to say job is being tracked

function showToast(message, color = "#333") {
  chrome.storage.local.get(['settings'], (result) => {
    const notificationsEnabled = result.settings?.enableNotifications ?? true;
    if (!notificationsEnabled) return;

    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.style = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        z-index: 10000;
      `;
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style = `
      background: ${color};
      color: white;
      padding: 12px 18px;
      border-radius: 8px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      font-family: sans-serif;
      font-size: 14px;
      opacity: 1;
      transition: opacity 0.3s ease;
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  });
}

//asking the user if they applied for an
function askIfApplied() {
  const existing = document.getElementById("apply-confirmation-popup");
  if (existing) existing.remove();

  const popup = document.createElement("div");
  popup.id = "apply-confirmation-popup";
  popup.style = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: white;
    color: #333;
    padding: 18px 22px;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    font-family: sans-serif;
    z-index: 10000;
    max-width: 260px;
  `;

  popup.innerHTML = `
    <div style="margin-bottom: 10px; font-weight: bold;">
      Did you apply for this job?
    </div>
    <div style="display: flex; justify-content: space-between; gap: 8px;">
      <button id="applied-yes" style="
        background: #27ae60; color: white; border: none; padding: 8px 12px;
        border-radius: 6px; cursor: pointer; flex: 1;
      ">Yes</button>
      <button id="applied-no" style="
        background: #c0392b; color: white; border: none; padding: 8px 12px;
        border-radius: 6px; cursor: pointer; flex: 1;
      ">No</button>
    </div>
  `;

  document.body.appendChild(popup);
  //user applied on external site
  document.getElementById("applied-yes").addEventListener("click", () => {
    popup.remove();
    chrome.storage.local.get(['currentJob'], (result) => {
      saveJobDetails(result.currentJob);
    })
  });
  //user didn't apply
  document.getElementById("applied-no").addEventListener("click", () => {
    popup.remove();
    showToast("❌ Job not saved.", "#7f8c8d");
  });
}


// Watch for apply button (for potential future use)
function watchApplyButton(buttonId) {
  const button = document.getElementById(buttonId);
  if (button && !button.dataset.tracked) {
    button.dataset.tracked = "true";
    button.addEventListener("click", () => {
      console.log("🖱 Apply button clicked");
      // Temporarily save the job so it can be accessed later
      chrome.storage.local.set({ currentJob: getJobDetails() }, () => {
        console.log("✅ Job saved to temporary storage.");
      });
      chrome.storage.local.get(['currentJob'], (result) => {
        console.log("saving job: ", result.currentJob);
      })
      if (buttonId === "applyButtonLinkContainer") {
        askIfApplied();
      }
    });
  }
}

// Detect if user is on Indeed job listing page
function isMainJobPage() {
  const url = window.location.href;
  return url.startsWith("https://uk.indeed.com");
}

// Watch for URL changes to detect post-apply page
function startURLWatcher() {
  let lastURL = window.location.href;
  console.log("👀 Starting URL watcher at:", lastURL);

  setInterval(() => {
    const currentURL = window.location.href;
    if (currentURL !== lastURL) {
      console.log("🔗 URL changed:", currentURL);
      lastURL = currentURL;

      // If user reaches the post-apply confirmation page
      if (currentURL.includes("smartapply.indeed.com/beta/indeedapply/form/post-apply")) {
        chrome.storage.local.get(['currentJob'], (result) => {
          console.log("saving job, post apply: ", result.currentJob);
          saveJobDetails(result.currentJob);
        })
      }
    }
  }, 1000);
}

// Save job details to Chrome storage
function saveJobDetails(jobToSave) {

  if (!jobToSave.jobTitle || jobToSave.jobTitle === "Unknown") {
    console.warn("⚠️ No valid job details found.");
    return;
  }

  chrome.storage.local.get(['jobApplications'], (result) => {
    const existingJobs = result.jobApplications || [];

    const isDuplicate = existingJobs.some(j =>
      j.jobTitle === jobToSave.jobTitle &&
      j.company === jobToSave.company &&
      j.location === jobToSave.location
    );

    if (isDuplicate) {
      showToast("⚠️ This job is already tracked.", "#c0392b");
      return;
    }

    // Assign a unique ID if it doesn’t already have one
    if (!jobToSave.id) {
      jobToSave.id = Date.now() + Math.random();
    }

    existingJobs.push(jobToSave);


    chrome.storage.local.set({ jobApplications: existingJobs }, () => {
      console.log("Job saved:", jobToSave);
      showToast(`✅ Tracked: ${jobToSave.jobTitle} at ${jobToSave.company}`, "#27ae60");
    });
  });
}

// Extract job details from the page
function getJobDetails() {
  let jobTitle = (
    document.querySelector('[data-testid="jobTitle"], h1.jobsearch-JobInfoHeader-title, h2.jobsearch-JobInfoHeader-title') ||
    Array.from(document.querySelectorAll('h1, h2')).find(el => el.textContent.length < 80)
  )?.textContent.trim() || "Unknown";

  // Remove "- job post" or similar endings (case-insensitive)
  jobTitle = jobTitle.replace(/\s*-\s*job\s*post/i, "").trim();

  const company = (
    document.querySelector('[data-testid="company"], .css-qcqa6h.e1wnkr790, [itemprop="hiringOrganization"] a, [itemprop="hiringOrganization"]')
  )?.textContent.trim() || "Unknown";

  const location = (
    document.querySelector('[data-testid="inlineHeader-companyLocation"], [data-testid="job-location"] , div.css-89aoy7 eu4oa1w0')
  )?.textContent.trim().split('•')[0].trim() || "Unknown";

  const salary = (
    document.querySelector('[data-testid="salary"], span.css-1oc7tea')
  )?.textContent.trim() || "Not listed";

  const date = new Date().toLocaleDateString();

  // --- Link (copied or fallback) ---
  const currentUrl = window.location.href;

  // Try to extract the job key from either jk=... or vjk=...
  const match = currentUrl.match(/[?&](?:jk|vjk)=([^&]+)/);
  const jobKey = match ? match[1] : null;

  let link; // declare outside so it's accessible later

  if (jobKey) {
    // Construct the clean Indeed job link
    link = `https://uk.indeed.com/viewjob?jk=${jobKey}`;
  } else {
    // fallback if no job key found
    link =
      document.querySelector('link[rel="canonical"]')?.href ||
      currentUrl ||
      "Unknown";
  }

  console.log(`current link ---- ${link}`)

  return { jobTitle, company, location, salary, date, link };
}


// --- Observe DOM for button (optional future use)
const observer = new MutationObserver(() => {
  watchApplyButton("applyButtonLinkContainer");
  watchApplyButton("indeedApplyButton");
});
observer.observe(document.body, { childList: true, subtree: true });

// --- On page load ---
window.addEventListener('load', () => {
  if (isMainJobPage()) {
    showToast("✅ Tracker now active", "#0a66c2");
  }
  startURLWatcher();
});
