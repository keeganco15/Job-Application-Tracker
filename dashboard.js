document.addEventListener('DOMContentLoaded', () => {

  const jobTableTemplate = `
      <div class="main-top-panel">
        <div class="main-top-left">
          <input type="text" id="search-bar" placeholder="Search jobs..." />
        </div>
        <div class="main-top-right">
          <button id="add-job-btn">➕ Add Job</button>
        </div>
      </div>
      <div id="main-content">
      <table id="job-table">
      <thead>
        <tr>
         <th>Title</th>
         <th>Company</th>
         <th>Location</th>
         <th>Salary</th>
         <th>Date Applied</th>
          <th>Site</th>
         <th>Status</th>
         <th>Link</th>
         <th>Favourite</th>
        </tr>
     </thead>
      <tbody id="job-list"></tbody>
    </table>
    </div>
    `;

  function renderJobs(jobList) {
    const jobListContainer = document.getElementById('job-list');
    jobListContainer.innerHTML = ''; // Clear existing jobs

    if (jobList.length === 0) {
      jobListContainer.innerHTML = `<tr><td colspan="7">No job applications tracked yet.</td></tr>`;
      return;
    }

    let openSubmenu = null;

    //loading each job and sorting the columns
    jobList.forEach((job, index) => {
      const mainRow = document.createElement('tr');
      mainRow.classList.add('job-main-row');
      mainRow.innerHTML = `
            <td>${job.jobTitle}</td>
            <td>${job.company}</td>
            <td>${job.location}</td>
            <td>${job.salary}</td>
            <td>${job.date}</td>
            <td>${job.site || "Indeed"}</td>
            <td>${job.status || "Applied"}</td>
            <td><a href="${job.link || "#"}" target="_blank">View</a></td>
            <td class="star-cell">
              <button class="star-btn" data-id="${job.id}">
                ${job.starred ? '⭐' : '☆'}
              </button>
            </td>
          `;

      const starButton = mainRow.querySelector('.star-btn');
      starButton.addEventListener('click', (e) => {
        e.stopPropagation(); // prevent opening submenu
        job.starred = !job.starred;

        // Update storage
        chrome.storage.local.get(['jobApplications'], (result) => {
          const jobs = result.jobApplications || [];
          const updated = jobs.map(j => j.id === job.id ? { ...j, starred: job.starred } : j);

          chrome.storage.local.set({ jobApplications: updated }, () => {
            // Update the icon without full re-render for smoother UX
            starButton.textContent = job.starred ? '⭐' : '☆';
          });
        });
      });


      const submenuRow = document.createElement('tr');
      submenuRow.classList.add('job-submenu-row', 'hidden');
      submenuRow.innerHTML = `
            <td colspan="7">
              <div class="submenu-container">
                <textarea placeholder="Add notes...">${job.notes || ''}</textarea>
                <div class="submenu-buttons">
                  <button class="edit-btn">Edit</button>
                  <button class="delete-btn">Delete</button>
                </div>
              </div>
            </td>
          `;

      mainRow.addEventListener('click', (e) => {
        const tag = e.target.tagName.toLowerCase();
        if (['input', 'textarea', 'button', 'select', 'a'].includes(tag)) return;

        const editButton = submenuRow.querySelector('.edit-btn');
        const isEditing = editButton && editButton.textContent.includes('Save');

        // If user is editing this job, don't allow toggling
        if (isEditing) return;

        // If another submenu is open and in edit mode, confirm before switching
        if (openSubmenu && openSubmenu !== submenuRow) {
          const openEditButton = openSubmenu.querySelector('.edit-btn');
          const isOtherEditing = openEditButton && openEditButton.textContent.includes('Save');

          if (isOtherEditing) {
            const confirmLeave = confirm(
              "You have unsaved changes on another job. Discard and open this one?"
            );
            if (!confirmLeave) return;

            // Re-render to reset edits before switching
            renderJobs(jobList);
            return;
          }

          // Close previously open submenu
          openSubmenu.classList.add('hidden');
        }

        // Toggle current submenu
        submenuRow.classList.toggle('hidden');
        openSubmenu = submenuRow.classList.contains('hidden') ? null : submenuRow;
      });


      const editButton = submenuRow.querySelector('.edit-btn');
      editButton.addEventListener('click', (e) => {
        e.stopPropagation();

        const deleteButton = submenuRow.querySelector('.delete-btn'); // grab delete button

        if (editButton.textContent.includes("Edit")) {
          if (deleteButton) deleteButton.style.display = "none";
          // Enable editing in the main row
          const cells = mainRow.querySelectorAll("td");
          const fields = ['jobTitle', 'company', 'location', 'date', 'site', 'status', 'link'];

          fields.forEach((field, i) => {
            const value = cells[i].innerText;

            // Custom inputs for specific fields
            if (field === 'date') {
              cells[i].innerHTML = `<input type="date" value="${job.date}" data-field="${field}">`;
            } else if (field === 'site') {
              cells[i].innerHTML = `
              <select data-field="${field}">
                <option value="Indeed" ${job.site === 'Indeed' ? 'selected' : ''}>Indeed</option>
                <option value="LinkedIn" ${job.site === 'LinkedIn' ? 'selected' : ''}>LinkedIn</option>
                <option value="Glassdoor" ${job.site === 'Glassdoor' ? 'selected' : ''}>Glassdoor</option>
                <option value="Other" ${job.site === 'Other' ? 'selected' : ''}>Other</option>
              </select>
            `;
            } else if (field === 'status') {
              cells[i].innerHTML = `
              <select data-field="${field}">
                <option value="Applied" ${job.status === 'Applied' ? 'selected' : ''}>Applied</option>
                <option value="Interview" ${job.status === 'Interview' ? 'selected' : ''}>Interview</option>
                <option value="Offer" ${job.status === 'Offer' ? 'selected' : ''}>Offer</option>
                <option value="Rejected" ${job.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                <option value="Withdrawn" ${job.status === 'Withdrawn' ? 'selected' : ''}>Withdrawn</option>
              </select>
            `;
            } else {
              cells[i].innerHTML = `<input type="text" value="${value}" data-field="${field}">`;
            }
          });

          // Enable editing for notes
          const notesArea = submenuRow.querySelector('textarea');
          notesArea.removeAttribute('readonly');

          // Change to Save/Cancel
          editButton.textContent = 'Save';
          const cancelButton = document.createElement('button');
          cancelButton.className = 'cancel-edit-btn';
          cancelButton.textContent = 'Cancel';
          editButton.insertAdjacentElement('afterend', cancelButton);

          cancelButton.addEventListener('click', (e) => {
            e.stopPropagation();
            submenuRow.classList.add('hidden'); // hide submenu explicitly
            openSubmenu = null;
            renderJobs(jobList); // reload to reset changes
          });

        } else {
          // Save changes
          const cells = mainRow.querySelectorAll("td");
          const updatedJob = { ...job };
          const fields = ['jobTitle', 'company', 'location', 'date', 'site', 'status', 'link'];

          fields.forEach((field, i) => {
            // Check for either <input> or <select>
            const input = cells[i].querySelector("input, select");
            if (input) {
              updatedJob[field] = input.value.trim();
            } else {
              updatedJob[field] = cells[i].innerText.trim();
            }
          });

          updatedJob.notes = submenuRow.querySelector("textarea").value.trim();

          // Update job list and refresh
          jobList[index] = updatedJob;
          chrome.storage.local.set({ jobApplications: jobList }, () => {
            renderJobs(jobList); // Refresh view
          });
        }
      });

      //delete job listing
      submenuRow.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this job entry?')) {
          chrome.storage.local.get(['jobApplications'], (result) => {
            let jobs = result.jobApplications || [];

            // Remove the job by its unique ID
            jobs = jobs.filter(j => j.id !== job.id);

            chrome.storage.local.set({ jobApplications: jobs }, () => {
              renderJobs(jobs); // re-render full list
            });
          });
        }
      });


      jobListContainer.appendChild(mainRow);
      jobListContainer.appendChild(submenuRow);
    });
  }

  //search bar functionality
  // === Search bar functionality inside the main panel ===
  function setupSearch(jobList) {
    const searchInput = document.getElementById('search-bar');

    if (!searchInput) return;

    searchInput.addEventListener('input', () => {
      const query = searchInput.value.toLowerCase().trim();
      const filtered = jobList.filter(job =>
        Object.values(job).some(val =>
          String(val).toLowerCase().includes(query)
        )
      );
      renderJobs(filtered);
    });
  }


  //Load the job board
  function loadJobBoard() {
    const mainPanel = document.getElementById('main-panel');
    mainPanel.innerHTML = jobTableTemplate;
    chrome.storage.local.get(['jobApplications'], (result) => {
      const jobList = result.jobApplications || [];
      renderJobs(jobList); setupSearch(jobList);
    });
  }

  loadJobBoard();

  //settings page injected to main panel
  document.getElementById('settings-btn').addEventListener('click', () => {
    fetch('settings.html')
      .then(res => res.text())
      .then(html => {
        const mainPanel = document.getElementById('main-panel');
        mainPanel.innerHTML = html;
      });
  });

  //account button, injecting account.html to main panel
  document.getElementById('account-btn').addEventListener('click', () => {
    fetch('account.html')
      .then(res => res.text())
      .then(html => {
        const mainPanel = document.getElementById('main-panel');
        mainPanel.innerHTML = html;

        // Load saved account details
        chrome.storage.local.get(['accountDetails'], (result) => {
          const data = result.accountDetails || {};
          document.getElementById('account-name').textContent = data.name || 'John Doe';
          document.getElementById('account-email').textContent = data.email || 'john.doe@example.com';
          document.getElementById('account-type').textContent = data.type || 'Free';
        });

        // Handle Edit Profile
        document.getElementById('edit-profile-btn').addEventListener('click', () => {
          function handleEditProfile() {
            const nameEl = document.getElementById('account-name');
            const emailEl = document.getElementById('account-email');
            const editBtn = document.getElementById('edit-profile-btn');

            // Prevent multiple edit states
            if (document.getElementById('edit-name')) return;

            // Convert text to input fields
            const currentName = nameEl.textContent;
            const currentEmail = emailEl.textContent;
            nameEl.innerHTML = `<input type="text" id="edit-name" value="${currentName}" />`;
            emailEl.innerHTML = `<input type="email" id="edit-email" value="${currentEmail}" />`;

            // Swap Edit → Save
            editBtn.textContent = 'Save Changes';
            editBtn.removeEventListener('click', handleEditProfile);
            editBtn.addEventListener('click', handleSaveProfile);

            // Add Cancel button if not exists
            if (!document.getElementById('cancel-edit-btn')) {
              const cancelBtn = document.createElement('button');
              cancelBtn.id = 'cancel-edit-btn';
              cancelBtn.textContent = 'Cancel';
              editBtn.insertAdjacentElement('afterend', cancelBtn);
              cancelBtn.addEventListener('click', handleCancelEdit);
            }
          }

          function handleSaveProfile() {
            const editBtn = document.getElementById('edit-profile-btn');
            const newName = document.getElementById('edit-name').value.trim();
            const newEmail = document.getElementById('edit-email').value.trim();

            const newDetails = {
              name: newName || 'John Doe',
              email: newEmail || 'john.doe@example.com',
              type: document.getElementById('account-type').textContent
            };

            chrome.storage.local.set({ accountDetails: newDetails }, () => {
              document.getElementById('account-name').textContent = newDetails.name;
              document.getElementById('account-email').textContent = newDetails.email;

              // Revert buttons
              editBtn.textContent = 'Edit Profile';
              editBtn.removeEventListener('click', handleSaveProfile);
              editBtn.addEventListener('click', handleEditProfile);

              const cancelBtn = document.getElementById('cancel-edit-btn');
              if (cancelBtn) cancelBtn.remove();
            });
          }

          function handleCancelEdit() {
            const nameEl = document.getElementById('account-name');
            const emailEl = document.getElementById('account-email');
            const editBtn = document.getElementById('edit-profile-btn');
            const cancelBtn = document.getElementById('cancel-edit-btn');

            chrome.storage.local.get(['accountDetails'], (result) => {
              const data = result.accountDetails || {};
              nameEl.textContent = data.name || 'John Doe';
              emailEl.textContent = data.email || 'john.doe@example.com';
            });

            // Reset buttons and events
            editBtn.textContent = 'Edit Profile';
            editBtn.removeEventListener('click', handleSaveProfile);
            editBtn.addEventListener('click', handleEditProfile);
            if (cancelBtn) cancelBtn.remove();
          }
        });

        // Handle Delete Account
        document.getElementById('delete-account-btn').addEventListener('click', () => {
          if (confirm('Are you sure you want to delete your account details?')) {
            chrome.storage.local.remove('accountDetails', () => {
              alert('Account data deleted.');
              document.getElementById('account-name').textContent = 'John Doe';
              document.getElementById('account-email').textContent = 'john.doe@example.com';
              document.getElementById('account-type').textContent = 'Free';
            });
          }
        });
      });
  });


  //add new job button, pushing new job to job list
  document.getElementById('add-job-btn').addEventListener('click', () => {
    fetch('addJob.html')
      .then(res => res.text())
      .then(html => {
        const mainPanel = document.getElementById('main-panel');
        mainPanel.innerHTML = html;

        const form = document.getElementById('add-job-form');
        form.addEventListener('submit', (e) => {
          e.preventDefault();

          const newJob = {
            jobTitle: document.getElementById('jobTitle').value,
            company: document.getElementById('company').value,
            location: document.getElementById('location').value,
            date: document.getElementById('date').value,
            site: document.getElementById('site').value,
            status: document.getElementById('status').value,
            link: document.getElementById('link').value,
            notes: document.getElementById('notes').value,
            starred: false
          };

          chrome.storage.local.get(['jobApplications'], (result) => {
            const jobs = result.jobApplications || [];
            jobs.push(newJob);
            chrome.storage.local.set({ jobApplications: jobs }, () => {
              // Return to main board
              loadJobBoard();
            });
          });
        });
      });
  });

  //load jobs when application board butotn pressed
  document.getElementById('applications-btn').addEventListener('click', () => {
    console.log('Button:', document.getElementById('applications-btn'));
    console.log('loadJobBoard:', typeof loadJobBoard);
    loadJobBoard();
  });


  //---------------------
});
