// ── Storage helpers ──────────────────────────────────────────────────────────

function getJobs() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['jobApplications'], (result) => {
      resolve(result.jobApplications || []);
    });
  });
}

function saveJobs(jobs) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ jobApplications: jobs }, resolve);
  });
}

// ── State ────────────────────────────────────────────────────────────────────

const state = {
  all: [],
  filtered: [],
  search: '',
  statusFilter: '',
  siteFilter: '',
  sortBy: 'date-desc',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function statusClass(status) {
  const map = {
    Applied: 'badge-applied',
    Interview: 'badge-interview',
    Offer: 'badge-offer',
    Rejected: 'badge-rejected',
    Withdrawn: 'badge-withdrawn',
  };
  return map[status] || 'badge-applied';
}

function formatDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return d;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Filter + sort ─────────────────────────────────────────────────────────────

function applyFilters() {
  let list = [...state.all];

  const q = state.search.toLowerCase().trim();
  if (q) {
    list = list.filter(j =>
      [j.jobTitle, j.company, j.location, j.site, j.status, j.notes]
        .some(v => String(v || '').toLowerCase().includes(q))
    );
  }

  if (state.statusFilter === 'starred') {
    list = list.filter(j => j.starred);
  } else if (state.statusFilter) {
    list = list.filter(j => (j.status || 'Applied') === state.statusFilter);
  }

  if (state.siteFilter) {
    list = list.filter(j => (j.site || 'Indeed') === state.siteFilter);
  }

  list.sort((a, b) => {
    switch (state.sortBy) {
      case 'date-asc':  return new Date(a.date || 0) - new Date(b.date || 0);
      case 'date-desc': return new Date(b.date || 0) - new Date(a.date || 0);
      case 'company':   return (a.company || '').localeCompare(b.company || '');
      case 'status':    return (a.status || '').localeCompare(b.status || '');
      case 'jobTitle':  return (a.jobTitle || '').localeCompare(b.jobTitle || '');
      default: return 0;
    }
  });

  state.filtered = list;
}

// ── Stats + sidebar counts ────────────────────────────────────────────────────

function updateStats() {
  const all = state.all;
  const total = all.length;
  const interviews = all.filter(j => j.status === 'Interview').length;
  const offers = all.filter(j => j.status === 'Offer').length;
  const responded = all.filter(j => ['Interview', 'Offer', 'Rejected'].includes(j.status)).length;
  const rate = total ? Math.round((responded / total) * 100) : 0;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-interview').textContent = interviews;
  document.getElementById('stat-offer').textContent = offers;
  document.getElementById('stat-rate').textContent = rate + '%';

  const counts = {
    all: total,
    starred: all.filter(j => j.starred).length,
    applied: all.filter(j => (j.status || 'Applied') === 'Applied').length,
    interview: interviews,
    offer: offers,
    rejected: all.filter(j => j.status === 'Rejected').length,
    withdrawn: all.filter(j => j.status === 'Withdrawn').length,
  };
  Object.entries(counts).forEach(([k, v]) => {
    const el = document.getElementById('count-' + k);
    if (el) el.textContent = v;
  });
}

// ── Render table ──────────────────────────────────────────────────────────────

function renderTable() {
  const tbody = document.getElementById('job-list');
  const empty = document.getElementById('empty-state');
  const countEl = document.getElementById('results-count');

  applyFilters();
  updateStats();

  countEl.textContent = state.filtered.length + ' job' + (state.filtered.length !== 1 ? 's' : '');

  if (state.filtered.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  tbody.innerHTML = '';
  state.filtered.forEach(job => {
    const status = job.status || 'Applied';
    const sClass = statusClass(status);

    const tr = document.createElement('tr');
    tr.className = 'job-row';
    tr.dataset.id = job.id;

    tr.innerHTML =
      '<td class="td-title">' + escHtml(job.jobTitle) + '</td>' +
      '<td>' + escHtml(job.company) + '</td>' +
      '<td>' + escHtml(job.location || '—') + '</td>' +
      '<td>' + escHtml(job.salary || '—') + '</td>' +
      '<td>' + formatDate(job.date) + '</td>' +
      '<td>' + escHtml(job.site || 'Indeed') + '</td>' +
      '<td><span class="badge ' + sClass + '">' + escHtml(status) + '</span></td>' +
      '<td>' + (job.link ? '<a class="row-link" href="' + escHtml(job.link) + '" target="_blank" rel="noopener">View</a>' : '<span style="color:#d1d5db">—</span>') + '</td>' +
      '<td><button class="star-btn" data-id="' + job.id + '">' + (job.starred ? '⭐' : '☆') + '</button></td>';

    const detailTr = document.createElement('tr');
    detailTr.className = 'detail-row hidden';
    detailTr.dataset.id = job.id;
    detailTr.innerHTML =
      '<td colspan="9"><div class="detail-inner">' +
        '<div class="detail-notes"><label>Notes</label>' +
        '<textarea class="notes-textarea" data-id="' + job.id + '" readonly>' + escHtml(job.notes || '') + '</textarea></div>' +
        '<div class="detail-btns">' +
          '<button class="btn-edit" data-id="' + job.id + '">Edit</button>' +
          '<button class="btn-delete" data-id="' + job.id + '">Delete</button>' +
        '</div></div></td>';

    tbody.appendChild(tr);
    tbody.appendChild(detailTr);
  });

  attachRowListeners();
}

// ── Row event listeners ───────────────────────────────────────────────────────

function attachRowListeners() {
  const tbody = document.getElementById('job-list');

  tbody.querySelectorAll('tr.job-row').forEach(function(tr) {
    tr.addEventListener('click', function(e) {
      if (e.target.closest('button, a, input, select, textarea')) return;

      const id = tr.dataset.id;
      const detailTr = tbody.querySelector('tr.detail-row[data-id="' + id + '"]');

      if (!detailTr.classList.contains('hidden')) {
        detailTr.classList.add('hidden');
        tr.classList.remove('expanded');
        return;
      }

      tbody.querySelectorAll('tr.detail-row:not(.hidden)').forEach(function(d) {
        d.classList.add('hidden');
        const sib = tbody.querySelector('tr.job-row[data-id="' + d.dataset.id + '"]');
        if (sib) sib.classList.remove('expanded');
      });

      detailTr.classList.remove('hidden');
      tr.classList.add('expanded');
    });
  });

  tbody.querySelectorAll('.star-btn').forEach(function(btn) {
    btn.addEventListener('click', async function(e) {
      e.stopPropagation();
      const id = btn.dataset.id;
      const jobs = await getJobs();
      const updated = jobs.map(j => String(j.id) === id ? Object.assign({}, j, { starred: !j.starred }) : j);
      await saveJobs(updated);
      state.all = updated;
      renderTable();
    });
  });

  tbody.querySelectorAll('.btn-edit').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      const id = btn.dataset.id;
      const job = state.all.find(j => String(j.id) === id);
      if (job) openModal(job);
    });
  });

  tbody.querySelectorAll('.btn-delete').forEach(function(btn) {
    btn.addEventListener('click', async function(e) {
      e.stopPropagation();
      if (!confirm('Delete this application?')) return;
      const id = btn.dataset.id;
      const jobs = await getJobs();
      const updated = jobs.filter(j => String(j.id) !== id);
      await saveJobs(updated);
      state.all = updated;
      renderTable();
    });
  });
}

// ── Modal ─────────────────────────────────────────────────────────────────────

let editingJobId = null;

function openModal(job) {
  editingJobId = job ? String(job.id) : null;

  document.getElementById('modal-title').textContent = job ? 'Edit Application' : 'Add Application';
  document.getElementById('modal-submit').textContent = job ? 'Save Changes' : 'Save';

  if (job) {
    document.getElementById('f-jobTitle').value = job.jobTitle || '';
    document.getElementById('f-company').value  = job.company  || '';
    document.getElementById('f-location').value = job.location || '';
    document.getElementById('f-salary').value   = job.salary   || '';
    document.getElementById('f-date').value     = job.date     || '';
    document.getElementById('f-site').value     = job.site     || 'Indeed';
    document.getElementById('f-status').value   = job.status   || 'Applied';
    document.getElementById('f-link').value     = job.link     || '';
    document.getElementById('f-notes').value    = job.notes    || '';
  } else {
    document.getElementById('add-job-form').reset();
  }

  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  editingJobId = null;
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const formJob = {
    jobTitle: document.getElementById('f-jobTitle').value.trim(),
    company:  document.getElementById('f-company').value.trim(),
    location: document.getElementById('f-location').value.trim(),
    salary:   document.getElementById('f-salary').value.trim(),
    date:     new Date().toISOString().split('T')[0], 
    site:     document.getElementById('f-site').value,
    status:   document.getElementById('f-status').value,
    link:     document.getElementById('f-link').value.trim(),
    notes:    document.getElementById('f-notes').value.trim(),
  };

  const jobs = await getJobs();
  let updated;

  if (editingJobId) {
    updated = jobs.map(j => String(j.id) === editingJobId ? Object.assign({}, j, formJob) : j);
  } else {
    formJob.id = Date.now();
    formJob.starred = false;
    updated = jobs.concat([formJob]);
  }

  await saveJobs(updated);
  state.all = updated;
  closeModal();
  renderTable();
}

// ── Sidebar nav ───────────────────────────────────────────────────────────────

function setupSidebar() {
  var navItems = [
    { id: 'nav-all',       filter: '' },
    { id: 'nav-starred',   filter: 'starred' },
    { id: 'nav-applied',   filter: 'Applied' },
    { id: 'nav-interview', filter: 'Interview' },
    { id: 'nav-offer',     filter: 'Offer' },
    { id: 'nav-rejected',  filter: 'Rejected' },
    { id: 'nav-withdrawn', filter: 'Withdrawn' },
  ];

  navItems.forEach(function(item) {
    document.getElementById(item.id).addEventListener('click', function() {
      navItems.forEach(function(n) { document.getElementById(n.id).classList.remove('active'); });
      document.getElementById(item.id).classList.add('active');
      state.statusFilter = item.filter;
      renderTable();
    });
  });
}

// ── Toolbar ───────────────────────────────────────────────────────────────────

function setupToolbar() {
  document.getElementById('search-bar').addEventListener('input', function(e) {
    state.search = e.target.value;
    renderTable();
  });

  document.getElementById('filter-site').addEventListener('change', function(e) {
    state.siteFilter = e.target.value;
    renderTable();
  });

  document.getElementById('sort-select').addEventListener('change', function(e) {
    state.sortBy = e.target.value;
    renderTable();
  });

  document.querySelectorAll('thead th[data-col]').forEach(function(th) {
    th.addEventListener('click', function() {
      document.querySelectorAll('thead th').forEach(function(t) { t.classList.remove('sorted'); });
      th.classList.add('sorted');
      state.sortBy = th.dataset.col;
      renderTable();
    });
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async function() {
  state.all = await getJobs();
  renderTable();
  setupSidebar();
  setupToolbar();

  document.getElementById('add-job-btn').addEventListener('click', function() { openModal(null); });
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-overlay').addEventListener('click', function(e) {
    if (e.target === document.getElementById('modal-overlay')) closeModal();
  });
  document.getElementById('add-job-form').addEventListener('submit', handleFormSubmit);
});
