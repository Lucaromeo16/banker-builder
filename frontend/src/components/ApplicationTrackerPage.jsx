import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

const STORAGE_KEY = 'bankerBuilderApplications';
const APPLICATION_COLUMNS = 'id, user_id, firm, role, office, group_name, status, deadline, notes';

const roleTypes = ['Summer Analyst', 'Lateral Hire', 'MBA Associate', 'Off-cycle / Spring', 'Other'];
const statusOptions = ['Interested', 'Applied', 'Networking', 'First Round', 'Superday', 'Offer', 'Rejected', 'Withdrawn'];
const contactStatusOptions = [
  'No Contact',
  'Outreach Sent',
  'Coffee Chat Completed',
  'Follow-Up Sent',
  'Referral Potential',
  'Referral Received'
];

const blankApplication = {
  firm: '',
  office: '',
  group: '',
  roleType: 'Summer Analyst',
  status: 'Interested',
  applicationDate: '',
  deadline: '',
  nextStepDate: '',
  contactName: '',
  contactStatus: 'No Contact',
  notes: ''
};

function loadApplications() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('[application-tracker] Failed to load applications', error);
    return [];
  }
}

function logApplicationSupabaseError(operation, error, details = {}) {
  if (!error) return;

  console.warn('[application-tracker] Supabase persistence error', {
    operation,
    code: error.code || null,
    message: error.message || null,
    userIdPresent: Boolean(details.userId),
    payloadKeys: details.payload ? Object.keys(details.payload) : []
  });
}

async function getApplicationPersistenceUserId(supabase, fallbackUser) {
  if (!supabase) return fallbackUser?.id || null;

  const { data, error } = await supabase.auth.getUser();
  if (error) {
    logApplicationSupabaseError('get-user', error, { userId: fallbackUser?.id });
    return fallbackUser?.id || null;
  }

  return data?.user?.id || fallbackUser?.id || null;
}

function mapApplicationRow(row) {
  return {
    id: row.id,
    storageProvider: 'supabase',
    firm: row.firm || '',
    office: row.office || '',
    group: row.group_name || '',
    roleType: row.role || 'Summer Analyst',
    status: row.status || 'Interested',
    applicationDate: '',
    deadline: row.deadline || '',
    nextStepDate: '',
    contactName: '',
    contactStatus: 'No Contact',
    notes: row.notes || ''
  };
}

function buildApplicationPayload(application, userId) {
  return {
    user_id: userId,
    firm: application.firm || '',
    role: application.roleType || '',
    office: application.office || '',
    group_name: application.group || '',
    status: application.status || 'Interested',
    deadline: application.deadline || null,
    notes: application.notes || ''
  };
}

function isUpcoming(dateValue) {
  if (!dateValue) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(`${dateValue}T00:00:00`);
  const inThirtyDays = new Date(today);
  inThirtyDays.setDate(today.getDate() + 30);
  return date >= today && date <= inThirtyDays;
}

function formatDate(dateValue) {
  if (!dateValue) return 'Not set';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${dateValue}T00:00:00`));
}

export default function ApplicationTrackerPage({ onBack }) {
  const { user, supabase, isAuthReady } = useAuth();
  const [applications, setApplications] = useState(loadApplications);
  const [form, setForm] = useState(blankApplication);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ status: 'All', firm: 'All', roleType: 'All' });
  const [syncMessage, setSyncMessage] = useState('');
  const [syncError, setSyncError] = useState('');
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  useEffect(() => {
    const localOnlyApplications = applications.filter((application) => application.storageProvider !== 'supabase');
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(localOnlyApplications));
  }, [applications]);

  useEffect(() => {
    if (!isAuthReady || !supabase || !user) return undefined;

    let isMounted = true;

    const loadSupabaseApplications = async () => {
      setApplicationsLoading(true);
      setSyncError('');
      const userId = await getApplicationPersistenceUserId(supabase, user);

      if (!userId) {
        if (isMounted) setApplicationsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('applications')
        .select(APPLICATION_COLUMNS)
        .eq('user_id', userId)
        .order('deadline', { ascending: true, nullsFirst: false });

      if (!isMounted) return;

      if (error) {
        logApplicationSupabaseError('load', error, { userId });
        setSyncError('Could not load applications from your account right now. Local applications are still available.');
        setApplicationsLoading(false);
        return;
      }

      const supabaseApplications = (data || []).map(mapApplicationRow);
      setApplications((current) => {
        const localApplications = current.filter((application) => application.storageProvider !== 'supabase');
        return [
          ...localApplications,
          ...supabaseApplications.filter(
            (savedApplication) => !localApplications.some((application) => application.id === savedApplication.id)
          )
        ];
      });
      setApplicationsLoading(false);
    };

    loadSupabaseApplications();

    return () => {
      isMounted = false;
    };
  }, [isAuthReady, supabase, user]);

  const firmOptions = useMemo(
    () => Array.from(new Set(applications.map((application) => application.firm).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [applications]
  );

  const filteredApplications = useMemo(
    () =>
      applications.filter((application) => {
        const statusMatch = filters.status === 'All' || application.status === filters.status;
        const firmMatch = filters.firm === 'All' || application.firm === filters.firm;
        const roleMatch = filters.roleType === 'All' || application.roleType === filters.roleType;
        return statusMatch && firmMatch && roleMatch;
      }),
    [applications, filters]
  );

  const groupedApplications = useMemo(
    () =>
      statusOptions.map((status) => ({
        status,
        applications: filteredApplications.filter((application) => application.status === status)
      })),
    [filteredApplications]
  );

  const metrics = useMemo(() => {
    const interviews = applications.filter((application) => ['First Round', 'Superday'].includes(application.status)).length;
    return {
      total: applications.length,
      applied: applications.filter((application) => application.status === 'Applied').length,
      interviews,
      offers: applications.filter((application) => application.status === 'Offer').length,
      upcomingDeadlines: applications.filter((application) => isUpcoming(application.deadline) || isUpcoming(application.nextStepDate)).length,
      referralOpportunities: applications.filter((application) =>
        ['Referral Potential', 'Referral Received'].includes(application.contactStatus)
      ).length
    };
  }, [applications]);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(blankApplication);
    setEditingId(null);
  };

  const saveApplication = async (event) => {
    event.preventDefault();
    setSyncMessage('');
    setSyncError('');

    const normalizedApplication = {
      ...form,
      firm: form.firm.trim(),
      office: form.office.trim(),
      group: form.group.trim(),
      contactName: form.contactName.trim(),
      notes: form.notes.trim()
    };

    if (!normalizedApplication.firm) return;

    if (editingId) {
      const previousApplication = applications.find((application) => application.id === editingId);
      const updatedApplication = {
        ...previousApplication,
        ...normalizedApplication,
        id: editingId,
        storageProvider: previousApplication?.storageProvider || 'local'
      };

      setApplications((current) =>
        current.map((application) => (application.id === editingId ? updatedApplication : application))
      );

      if (previousApplication?.storageProvider === 'supabase' && supabase && user) {
        const userId = await getApplicationPersistenceUserId(supabase, user);

        if (userId) {
          const payload = buildApplicationPayload(updatedApplication, userId);
          delete payload.user_id;
          const { error } = await supabase
            .from('applications')
            .update(payload)
            .eq('id', editingId)
            .eq('user_id', userId);

          if (error) {
            logApplicationSupabaseError('update', error, { userId, payload });
            setApplications((current) =>
              current.map((application) =>
                application.id === editingId ? { ...application, storageProvider: 'local' } : application
              )
            );
            setSyncError('Could not sync applications to your account. Saved locally on this device instead.');
          } else {
            setSyncMessage('Application updated in your Banker Builder account.');
          }
        }
      }
    } else {
      const localApplication = {
        ...normalizedApplication,
        id: crypto.randomUUID(),
        storageProvider: 'local'
      };

      if (supabase && user) {
        const userId = await getApplicationPersistenceUserId(supabase, user);

        if (userId) {
          const payload = buildApplicationPayload(normalizedApplication, userId);
          const { data, error } = await supabase
            .from('applications')
            .insert(payload)
            .select(APPLICATION_COLUMNS)
            .single();

          if (error || !data) {
            logApplicationSupabaseError('create', error, { userId, payload });
            setApplications((current) => [localApplication, ...current]);
            setSyncError('Could not sync applications to your account. Saved locally on this device instead.');
          } else {
            setApplications((current) => [
              {
                ...mapApplicationRow(data),
                applicationDate: normalizedApplication.applicationDate,
                nextStepDate: normalizedApplication.nextStepDate,
                contactName: normalizedApplication.contactName,
                contactStatus: normalizedApplication.contactStatus
              },
              ...current
            ]);
            setSyncMessage('Application saved to your Banker Builder account.');
          }
        } else {
          setApplications((current) => [localApplication, ...current]);
          setSyncMessage('Application saved locally on this device.');
        }
      } else {
        setApplications((current) => [localApplication, ...current]);
        setSyncMessage('Application saved locally on this device.');
      }
    }

    resetForm();
  };

  const editApplication = (application) => {
    setForm({
      firm: application.firm || '',
      office: application.office || '',
      group: application.group || '',
      roleType: application.roleType || 'Summer Analyst',
      status: application.status || 'Interested',
      applicationDate: application.applicationDate || '',
      deadline: application.deadline || '',
      nextStepDate: application.nextStepDate || '',
      contactName: application.contactName || '',
      contactStatus: application.contactStatus || 'No Contact',
      notes: application.notes || ''
    });
    setEditingId(application.id);
  };

  const deleteApplication = async (applicationId) => {
    setSyncMessage('');
    setSyncError('');
    const application = applications.find((item) => item.id === applicationId);

    if (application?.storageProvider === 'supabase' && supabase && user) {
      const userId = await getApplicationPersistenceUserId(supabase, user);

      if (!userId) {
        setSyncError('Sign in to delete synced applications.');
        return;
      }

      const payload = { id: applicationId, user_id: userId };
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', applicationId)
        .eq('user_id', userId);

      if (error) {
        logApplicationSupabaseError('delete', error, { userId, payload });
        setSyncError('Application could not be deleted from your account. Please try again.');
        return;
      }

      setSyncMessage('Application deleted from your Banker Builder account.');
    }

    setApplications((current) => current.filter((application) => application.id !== applicationId));
    if (editingId === applicationId) resetForm();
  };

  const updateStatus = async (applicationId, status) => {
    setSyncMessage('');
    setSyncError('');
    const previousApplication = applications.find((application) => application.id === applicationId);

    setApplications((current) =>
      current.map((application) => (application.id === applicationId ? { ...application, status } : application))
    );

    if (previousApplication?.storageProvider !== 'supabase' || !supabase || !user) return;

    const userId = await getApplicationPersistenceUserId(supabase, user);

    if (!userId) {
      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId ? { ...application, storageProvider: 'local' } : application
        )
      );
      setSyncError('Could not sync applications to your account. Saved locally on this device instead.');
      return;
    }

    const payload = { status };
    const { error } = await supabase
      .from('applications')
      .update(payload)
      .eq('id', applicationId)
      .eq('user_id', userId);

    if (error) {
      logApplicationSupabaseError('status-update', error, { userId, payload });
      setApplications((current) =>
        current.map((application) =>
          application.id === applicationId ? { ...application, storageProvider: 'local' } : application
        )
      );
      setSyncError('Could not sync applications to your account. Saved locally on this device instead.');
    }
  };

  return (
    <section className="application-tracker-page">
      <button type="button" className="back-button" onClick={onBack}>
        Back to Home
      </button>

      <div className="networking-header">
        <div>
          <span className="feature-eyebrow">Application workflow</span>
          <h2>Application Tracker</h2>
          <p>Track applications, interview rounds, deadlines, contacts, and recruiting notes.</p>
          <p className="muted">Applications sync to your Banker Builder account. If syncing fails, they are stored locally on this device.</p>
          {applicationsLoading ? <p className="muted">Loading saved applications...</p> : null}
          {syncMessage ? <p className="muted">{syncMessage}</p> : null}
          {syncError ? <p className="error">{syncError}</p> : null}
        </div>
      </div>

      <div className="networking-metrics">
        <article className="network-metric-card">
          <span>Total Applications</span>
          <strong>{metrics.total}</strong>
        </article>
        <article className="network-metric-card">
          <span>Applied</span>
          <strong>{metrics.applied}</strong>
        </article>
        <article className="network-metric-card">
          <span>Interviews</span>
          <strong>{metrics.interviews}</strong>
        </article>
        <article className="network-metric-card">
          <span>Offers</span>
          <strong>{metrics.offers}</strong>
        </article>
        <article className="network-metric-card">
          <span>Upcoming Deadlines</span>
          <strong>{metrics.upcomingDeadlines}</strong>
        </article>
        <article className="network-metric-card">
          <span>Referral Opportunities</span>
          <strong>{metrics.referralOpportunities}</strong>
        </article>
      </div>

      <div className="application-layout">
        <section className="network-section" aria-labelledby="application-form-title">
          <div className="section-heading">
            <h3 id="application-form-title">{editingId ? 'Edit Application' : 'Add Application'}</h3>
            {editingId ? (
              <button type="button" className="secondary" onClick={resetForm}>
                Cancel Edit
              </button>
            ) : null}
          </div>

          <form className="application-form" onSubmit={saveApplication}>
            <label>
              Firm
              <input value={form.firm} onChange={(event) => updateForm('firm', event.target.value)} placeholder="Goldman Sachs" required />
            </label>
            <label>
              Office
              <input value={form.office} onChange={(event) => updateForm('office', event.target.value)} placeholder="New York, NY" />
            </label>
            <label>
              Group
              <input value={form.group} onChange={(event) => updateForm('group', event.target.value)} placeholder="M&A, Industrials..." />
            </label>
            <label>
              Role Type
              <select value={form.roleType} onChange={(event) => updateForm('roleType', event.target.value)}>
                {roleTypes.map((roleType) => (
                  <option key={roleType}>{roleType}</option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select value={form.status} onChange={(event) => updateForm('status', event.target.value)}>
                {statusOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
            <label>
              Application Date
              <input type="date" value={form.applicationDate} onChange={(event) => updateForm('applicationDate', event.target.value)} />
            </label>
            <label>
              Deadline
              <input type="date" value={form.deadline} onChange={(event) => updateForm('deadline', event.target.value)} />
            </label>
            <label>
              Next Step Date
              <input type="date" value={form.nextStepDate} onChange={(event) => updateForm('nextStepDate', event.target.value)} />
            </label>
            <label>
              Contact Name
              <input value={form.contactName} onChange={(event) => updateForm('contactName', event.target.value)} placeholder="Banker or recruiter" />
            </label>
            <label>
              Contact Status
              <select value={form.contactStatus} onChange={(event) => updateForm('contactStatus', event.target.value)}>
                {contactStatusOptions.map((contactStatus) => (
                  <option key={contactStatus}>{contactStatus}</option>
                ))}
              </select>
            </label>
            <label className="application-notes-field">
              Notes
              <textarea value={form.notes} onChange={(event) => updateForm('notes', event.target.value)} placeholder="Recruiting notes, next actions, prep focus..." />
            </label>
            <button type="submit" className="primary">
              {editingId ? 'Save Changes' : 'Add Application'}
            </button>
          </form>
        </section>

        <section className="network-section" aria-labelledby="application-filters-title">
          <h3 id="application-filters-title">Filters</h3>
          <div className="application-filters">
            <label>
              Status
              <select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
                <option>All</option>
                {statusOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>
            <label>
              Firm
              <select value={filters.firm} onChange={(event) => setFilters((current) => ({ ...current, firm: event.target.value }))}>
                <option>All</option>
                {firmOptions.map((firm) => (
                  <option key={firm}>{firm}</option>
                ))}
              </select>
            </label>
            <label>
              Role Type
              <select value={filters.roleType} onChange={(event) => setFilters((current) => ({ ...current, roleType: event.target.value }))}>
                <option>All</option>
                {roleTypes.map((roleType) => (
                  <option key={roleType}>{roleType}</option>
                ))}
              </select>
            </label>
          </div>
          <p className="muted">Showing {filteredApplications.length} matching applications.</p>
        </section>
      </div>

      <section className="network-section" aria-labelledby="application-board-title">
        <h3 id="application-board-title">Application Board</h3>
        <div className="application-board">
          {groupedApplications.map((group) => (
            <article className="pipeline-column application-column" key={group.status}>
              <h4>
                {group.status}
                <span>{group.applications.length}</span>
              </h4>
              <div className="pipeline-stack">
                {group.applications.length ? (
                  group.applications.map((application) => (
                    <div className="application-card" key={application.id}>
                      <div className="contact-card-heading">
                        <div>
                          <h4>{application.firm}</h4>
                          <p>
                            {[application.office, application.group, application.roleType].filter(Boolean).join(' • ') || application.roleType}
                          </p>
                        </div>
                        <span>{application.contactStatus}</span>
                      </div>
                      <dl>
                        <div>
                          <dt>Deadline</dt>
                          <dd>{formatDate(application.deadline)}</dd>
                        </div>
                        <div>
                          <dt>Next Step</dt>
                          <dd>{formatDate(application.nextStepDate)}</dd>
                        </div>
                        <div>
                          <dt>Contact</dt>
                          <dd>{application.contactName || 'None'}</dd>
                        </div>
                        <div>
                          <dt>Applied</dt>
                          <dd>{formatDate(application.applicationDate)}</dd>
                        </div>
                      </dl>
                      {application.notes ? <p className="contact-notes">{application.notes}</p> : null}
                      <label>
                        Update status
                        <select value={application.status} onChange={(event) => updateStatus(application.id, event.target.value)}>
                          {statusOptions.map((status) => (
                            <option key={status}>{status}</option>
                          ))}
                        </select>
                      </label>
                      <div className="contact-actions">
                        <button type="button" className="secondary" onClick={() => editApplication(application)}>
                          Edit
                        </button>
                        <button type="button" className="secondary" onClick={() => deleteApplication(application.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="muted">No applications in this stage.</p>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
