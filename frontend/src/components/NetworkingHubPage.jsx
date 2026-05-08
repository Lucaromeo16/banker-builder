import { useEffect, useMemo, useState } from 'react';
import ibOffices from '../../../data/ibOffices.json';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const CONTACTS_STORAGE_KEY = 'bankerBuilder.networkingContacts';

const connectionTypes = ['Cold Outreach', 'Alumni', 'Friend/Family', 'Campus Event', 'Recruiter', 'Existing Relationship'];
const relationshipStrengths = ['Cold', 'Warm', 'Strong', 'Referral Potential', 'Referral'];
const pipelineStatuses = [
  'Not Contacted',
  'Outreach Sent',
  'Responded',
  'Coffee Chat Scheduled',
  'Coffee Chat Completed',
  'Follow-Up Sent',
  'Strong Relationship',
  'Referral Received'
];
const outreachTypes = ['Cold Email', 'LinkedIn Message', 'Follow-Up', 'Thank You Email', 'Referral Ask'];
const bankerSeniorities = ['Analyst', 'Associate', 'VP', 'Director', 'Managing Director'];
const tones = ['Professional', 'Confident', 'Conversational'];

const emptyContact = {
  name: '',
  firm: '',
  office: '',
  group: '',
  title: '',
  email: '',
  linkedin: '',
  connectionType: 'Cold Outreach',
  relationshipStrength: 'Cold',
  lastInteractionDate: '',
  status: 'Not Contacted',
  notes: ''
};

const emptyDraftRequest = {
  outreachType: 'Cold Email',
  firm: '',
  office: '',
  group: '',
  bankerSeniority: 'Analyst',
  tone: 'Professional'
};

function readContacts() {
  try {
    return JSON.parse(localStorage.getItem(CONTACTS_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function officeOptionsForFirm(firm) {
  return [...new Set(ibOffices.filter((office) => office.firm === firm).map((office) => `${office.officeCity}, ${office.state}`))].sort();
}

function groupOptionsForFirmOffice(firm, officeLabel) {
  const city = officeLabel.split(',')[0];
  return [
    ...new Set(
      ibOffices
        .filter((office) => office.firm === firm && (!city || office.officeCity === city))
        .flatMap((office) => office.groups || [])
    )
  ].sort();
}

function createLocalDraft(request) {
  const officeText = request.office ? ` in ${request.office}` : '';
  const groupText = request.group ? ` ${request.group}` : '';
  const subjectLine = request.outreachType === 'LinkedIn Message' ? '' : `${request.firm} networking request`;

  if (request.outreachType === 'Referral Ask') {
    return {
      subjectLine: `Following up on ${request.firm}`,
      draft: `Hi [Name],\n\nI hope you are doing well. I appreciated learning more about ${request.firm}${officeText}${groupText ? ` and the ${request.group} group` : ''}. After reflecting on our conversation and continuing to learn about the platform, I remain very interested in recruiting with the team.\n\nIf you feel comfortable, I would be grateful for any guidance on the process or whether a referral would be appropriate. Either way, I appreciate your time and advice.\n\nBest,\n[Your Name]`
    };
  }

  if (request.outreachType === 'Thank You Email') {
    return {
      subjectLine: 'Thank you',
      draft: `Hi [Name],\n\nThank you again for taking the time to speak with me. I enjoyed learning about your experience at ${request.firm}${officeText}${request.group ? ` and your work in ${request.group}` : ''}.\n\nOur conversation made me even more interested in the firm, especially the team’s approach to analyst development and live transaction work. I appreciate your advice and will keep you posted as I continue through recruiting.\n\nBest,\n[Your Name]`
    };
  }

  if (request.outreachType === 'Follow-Up') {
    return {
      subjectLine: `Following up - ${request.firm}`,
      draft: `Hi [Name],\n\nI hope you are doing well. I wanted to follow up on my note below and reiterate my interest in learning more about your experience at ${request.firm}${officeText}.\n\nI know your schedule is busy, but I would really appreciate the chance to ask a few questions about your path and the team if you have 15 minutes in the coming weeks.\n\nBest,\n[Your Name]`
    };
  }

  const draft =
    request.outreachType === 'LinkedIn Message'
      ? `Hi [Name], I’m a student interested in investment banking and came across your background at ${request.firm}${officeText}. I’d be grateful to connect and ask a few brief questions about your experience if you are open to it. Best, [Your Name]`
      : `Hi [Name],\n\nMy name is [Your Name], and I’m a student interested in investment banking. I came across your background at ${request.firm}${officeText}${request.group ? `, particularly your work around ${request.group}` : ''}, and wanted to reach out.\n\nI would be grateful for the opportunity to learn more about your experience, the team, and any advice you may have for someone preparing for recruiting. If you have 15 minutes in the coming weeks, I would really appreciate the chance to speak.\n\nBest,\n[Your Name]`;

  return { subjectLine, draft };
}

export default function NetworkingHubPage({ onBack, prefillContact, onPrefillConsumed }) {
  const firmOptions = useMemo(() => [...new Set(ibOffices.map((office) => office.firm))].sort(), []);
  const [contacts, setContacts] = useState(() => readContacts());
  const [form, setForm] = useState(emptyContact);
  const [editingId, setEditingId] = useState(null);
  const [draftRequest, setDraftRequest] = useState(emptyDraftRequest);
  const [draft, setDraft] = useState(null);
  const [draftLoading, setDraftLoading] = useState(false);
  const [draftError, setDraftError] = useState('');

  useEffect(() => {
    localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
  }, [contacts]);

  useEffect(() => {
    if (!prefillContact) return;

    const office = prefillContact.state ? `${prefillContact.officeCity}, ${prefillContact.state}` : prefillContact.office || '';
    setForm((current) => ({
      ...current,
      firm: prefillContact.firm || current.firm,
      office,
      group: prefillContact.group || current.group
    }));
    setDraftRequest((current) => ({
      ...current,
      firm: prefillContact.firm || current.firm,
      office,
      group: prefillContact.group || current.group
    }));
    onPrefillConsumed?.();
  }, [prefillContact, onPrefillConsumed]);

  const metrics = useMemo(() => {
    const sent = contacts.filter((contact) => contact.status !== 'Not Contacted').length;
    const responded = contacts.filter((contact) => !['Not Contacted', 'Outreach Sent'].includes(contact.status)).length;
    const officeCounts = contacts.reduce((counts, contact) => {
      if (!contact.office) return counts;
      counts[contact.office] = (counts[contact.office] || 0) + 1;
      return counts;
    }, {});
    const strongestOffice = Object.entries(officeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None yet';

    return {
      total: contacts.length,
      coffeeChats: contacts.filter((contact) => ['Coffee Chat Completed', 'Follow-Up Sent', 'Strong Relationship', 'Referral Received'].includes(contact.status)).length,
      pendingFollowUps: contacts.filter((contact) => contact.status === 'Coffee Chat Completed').length,
      strongRelationships: contacts.filter((contact) => ['Strong', 'Referral Potential', 'Referral'].includes(contact.relationshipStrength)).length,
      referrals: contacts.filter((contact) => contact.status === 'Referral Received' || contact.relationshipStrength === 'Referral').length,
      responseRate: sent ? Math.round((responded / sent) * 100) : 0,
      networkingScore: Math.min(100, contacts.length * 4 + responded * 6),
      strongestOffice
    };
  }, [contacts]);

  const analytics = useMemo(() => {
    const byFirm = contacts.reduce((counts, contact) => {
      if (!contact.firm) return counts;
      counts[contact.firm] = (counts[contact.firm] || 0) + 1;
      return counts;
    }, {});
    const byConnection = contacts.reduce((counts, contact) => {
      counts[contact.connectionType] = (counts[contact.connectionType] || 0) + 1;
      return counts;
    }, {});

    return {
      strongestFirms: Object.entries(byFirm).sort((a, b) => b[1] - a[1]).slice(0, 4),
      bestCategory: Object.entries(byConnection).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None yet',
      warmRelationships: contacts.filter((contact) => ['Warm', 'Strong', 'Referral Potential', 'Referral'].includes(contact.relationshipStrength)).length
    };
  }, [contacts]);

  const formOffices = officeOptionsForFirm(form.firm);
  const formGroups = groupOptionsForFirmOffice(form.firm, form.office);
  const draftOffices = officeOptionsForFirm(draftRequest.firm);
  const draftGroups = groupOptionsForFirmOffice(draftRequest.firm, draftRequest.office);

  const updateForm = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === 'firm' ? { office: '', group: '' } : {}),
      ...(key === 'office' ? { group: '' } : {})
    }));
  };

  const saveContact = (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.firm) return;

    if (editingId) {
      setContacts((current) => current.map((contact) => (contact.id === editingId ? { ...form, id: editingId } : contact)));
    } else {
      setContacts((current) => [{ ...form, id: globalThis.crypto?.randomUUID?.() || `${Date.now()}` }, ...current]);
    }
    setForm(emptyContact);
    setEditingId(null);
  };

  const editContact = (contact) => {
    setForm(contact);
    setEditingId(contact.id);
  };

  const deleteContact = (contactId) => {
    setContacts((current) => current.filter((contact) => contact.id !== contactId));
    if (editingId === contactId) {
      setEditingId(null);
      setForm(emptyContact);
    }
  };

  const updateContactStatus = (contactId, status) => {
    setContacts((current) => current.map((contact) => (contact.id === contactId ? { ...contact, status } : contact)));
  };

  const moveContact = (contact, direction) => {
    const index = pipelineStatuses.indexOf(contact.status);
    const nextStatus = pipelineStatuses[Math.max(0, Math.min(pipelineStatuses.length - 1, index + direction))];
    updateContactStatus(contact.id, nextStatus);
  };

  const updateDraftRequest = (key, value) => {
    setDraftRequest((current) => ({
      ...current,
      [key]: value,
      ...(key === 'firm' ? { office: '', group: '' } : {}),
      ...(key === 'office' ? { group: '' } : {})
    }));
  };

  const generateDraft = async () => {
    setDraft(null);
    setDraftError('');
    setDraftLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/networking-outreach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftRequest)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.details || errorData?.error || `Outreach request failed (${response.status})`);
      }

      setDraft(await response.json());
    } catch (error) {
      console.error('AI outreach generation failed. Using local draft fallback.', error);
      setDraft(createLocalDraft(draftRequest));
      setDraftError('AI draft could not be generated, so a local template was used.');
    } finally {
      setDraftLoading(false);
    }
  };

  return (
    <>
      <button type="button" className="back-button" onClick={onBack}>
        Back to Home
      </button>

      <section className="panel networking-page">
        <div className="networking-header">
          <div>
            <span className="feature-eyebrow">Recruiting CRM</span>
            <h2>Networking Hub</h2>
            <p>Track banker relationships, coffee chats, follow-ups, referrals, and outreach drafts in one workspace.</p>
          </div>
        </div>

        <div className="networking-metrics">
          {[
            ['Total Contacts', metrics.total],
            ['Coffee Chats Completed', metrics.coffeeChats],
            ['Pending Follow-Ups', metrics.pendingFollowUps],
            ['Strong Relationships', metrics.strongRelationships],
            ['Referrals', metrics.referrals],
            ['Response Rate', `${metrics.responseRate}%`],
            ['Networking Score', metrics.networkingScore],
            ['Strongest Office', metrics.strongestOffice]
          ].map(([label, value]) => (
            <article className="network-metric-card" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </div>

        <div className="networking-layout">
          <section className="network-section">
            <div className="section-heading">
              <h3>{editingId ? 'Edit Contact' : 'Add Contact'}</h3>
              {editingId ? (
                <button type="button" className="text-button" onClick={() => { setEditingId(null); setForm(emptyContact); }}>
                  Cancel
                </button>
              ) : null}
            </div>
            <form className="network-contact-form" onSubmit={saveContact}>
              <label>
                <span>Name</span>
                <input value={form.name} onChange={(event) => updateForm('name', event.target.value)} placeholder="Banker name" />
              </label>
              <label>
                <span>Firm</span>
                <select value={form.firm} onChange={(event) => updateForm('firm', event.target.value)}>
                  <option value="">Select firm</option>
                  {firmOptions.map((firm) => <option key={firm} value={firm}>{firm}</option>)}
                </select>
              </label>
              <label>
                <span>Office</span>
                <select value={form.office} onChange={(event) => updateForm('office', event.target.value)}>
                  <option value="">Select office</option>
                  {formOffices.map((office) => <option key={office} value={office}>{office}</option>)}
                </select>
              </label>
              <label>
                <span>Group</span>
                <select value={form.group} onChange={(event) => updateForm('group', event.target.value)}>
                  <option value="">Select group</option>
                  {formGroups.map((group) => <option key={group} value={group}>{group}</option>)}
                </select>
              </label>
              <label>
                <span>Title</span>
                <input value={form.title} onChange={(event) => updateForm('title', event.target.value)} placeholder="Analyst, Associate, VP..." />
              </label>
              <label>
                <span>Email</span>
                <input value={form.email} onChange={(event) => updateForm('email', event.target.value)} placeholder="name@firm.com" />
              </label>
              <label>
                <span>LinkedIn</span>
                <input value={form.linkedin} onChange={(event) => updateForm('linkedin', event.target.value)} placeholder="Profile URL" />
              </label>
              <label>
                <span>Connection Type</span>
                <select value={form.connectionType} onChange={(event) => updateForm('connectionType', event.target.value)}>
                  {connectionTypes.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label>
                <span>Relationship Strength</span>
                <select value={form.relationshipStrength} onChange={(event) => updateForm('relationshipStrength', event.target.value)}>
                  {relationshipStrengths.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label>
                <span>Status</span>
                <select value={form.status} onChange={(event) => updateForm('status', event.target.value)}>
                  {pipelineStatuses.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label>
                <span>Last Interaction</span>
                <input type="date" value={form.lastInteractionDate} onChange={(event) => updateForm('lastInteractionDate', event.target.value)} />
              </label>
              <label className="network-notes-field">
                <span>Notes</span>
                <textarea value={form.notes} onChange={(event) => updateForm('notes', event.target.value)} placeholder="Conversation notes, follow-up items, personal details..." />
              </label>
              <button type="submit" className="primary">{editingId ? 'Save Contact' : 'Add Contact'}</button>
            </form>
          </section>

          <section className="network-section">
            <h3>AI Outreach Assistant</h3>
            <div className="network-contact-form">
              <label>
                <span>Outreach Type</span>
                <select value={draftRequest.outreachType} onChange={(event) => updateDraftRequest('outreachType', event.target.value)}>
                  {outreachTypes.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label>
                <span>Firm</span>
                <select value={draftRequest.firm} onChange={(event) => updateDraftRequest('firm', event.target.value)}>
                  <option value="">Select firm</option>
                  {firmOptions.map((firm) => <option key={firm} value={firm}>{firm}</option>)}
                </select>
              </label>
              <label>
                <span>Office</span>
                <select value={draftRequest.office} onChange={(event) => updateDraftRequest('office', event.target.value)}>
                  <option value="">Select office</option>
                  {draftOffices.map((office) => <option key={office} value={office}>{office}</option>)}
                </select>
              </label>
              <label>
                <span>Group</span>
                <select value={draftRequest.group} onChange={(event) => updateDraftRequest('group', event.target.value)}>
                  <option value="">Select group</option>
                  {draftGroups.map((group) => <option key={group} value={group}>{group}</option>)}
                </select>
              </label>
              <label>
                <span>Banker Seniority</span>
                <select value={draftRequest.bankerSeniority} onChange={(event) => updateDraftRequest('bankerSeniority', event.target.value)}>
                  {bankerSeniorities.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label>
                <span>Tone</span>
                <select value={draftRequest.tone} onChange={(event) => updateDraftRequest('tone', event.target.value)}>
                  {tones.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <button type="button" className="primary" onClick={generateDraft} disabled={!draftRequest.firm || draftLoading}>
                {draftLoading ? 'Generating...' : 'Generate Outreach'}
              </button>
            </div>
            {draftError ? <p className="error">{draftError}</p> : null}
            {draft ? (
              <article className="outreach-draft-card">
                {draft.subjectLine ? <p><strong>Subject:</strong> {draft.subjectLine}</p> : null}
                <pre>{draft.draft}</pre>
              </article>
            ) : null}
          </section>
        </div>

        <section className="network-section">
          <h3>Contacts Database</h3>
          <div className="contacts-grid">
            {contacts.length ? contacts.map((contact) => (
              <article className="contact-card" key={contact.id}>
                <div className="contact-card-heading">
                  <div>
                    <h4>{contact.name}</h4>
                    <p>{contact.firm} · {contact.office || 'Office TBD'} · {contact.group || 'Group TBD'}</p>
                  </div>
                  <span>{contact.status}</span>
                </div>
                <dl>
                  <div><dt>Title</dt><dd>{contact.title || 'Not set'}</dd></div>
                  <div><dt>Relationship</dt><dd>{contact.relationshipStrength}</dd></div>
                  <div><dt>Connection</dt><dd>{contact.connectionType}</dd></div>
                  <div><dt>Last interaction</dt><dd>{contact.lastInteractionDate || 'Not logged'}</dd></div>
                </dl>
                {contact.notes ? <p className="contact-notes">{contact.notes}</p> : null}
                <div className="contact-actions">
                  <button type="button" className="text-button" onClick={() => editContact(contact)}>Edit</button>
                  <button type="button" className="text-button" onClick={() => deleteContact(contact.id)}>Delete</button>
                </div>
              </article>
            )) : <p className="muted">No contacts yet. Add your first banker contact above.</p>}
          </div>
        </section>

        <section className="network-section">
          <h3>Pipeline View</h3>
          <div className="pipeline-board">
            {pipelineStatuses.map((status) => {
              const stageContacts = contacts.filter((contact) => contact.status === status);
              return (
                <article className="pipeline-column" key={status}>
                  <h4>{status} <span>{stageContacts.length}</span></h4>
                  <div className="pipeline-stack">
                    {stageContacts.map((contact) => (
                      <div className="pipeline-contact" key={contact.id}>
                        <strong>{contact.name}</strong>
                        <span>{contact.firm} · {contact.office || 'Office TBD'}</span>
                        <div>
                          <button type="button" onClick={() => moveContact(contact, -1)}>Back</button>
                          <button type="button" onClick={() => moveContact(contact, 1)}>Next</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="network-section">
          <h3>Networking Analytics</h3>
          <div className="analytics-grid">
            <article>
              <span>Strongest Firms</span>
              <p>{analytics.strongestFirms.length ? analytics.strongestFirms.map(([firm, count]) => `${firm} (${count})`).join(', ') : 'None yet'}</p>
            </article>
            <article>
              <span>Highest Activity Category</span>
              <p>{analytics.bestCategory}</p>
            </article>
            <article>
              <span>Warm Relationships</span>
              <p>{analytics.warmRelationships}</p>
            </article>
            <article>
              <span>Referral Count</span>
              <p>{metrics.referrals}</p>
            </article>
          </div>
        </section>
      </section>
    </>
  );
}
