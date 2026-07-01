import { useEffect, useMemo, useState } from 'react';
import api from '../../../api/axios';
import Sidebar from '../../../components/common/Sidebar.jsx';
import './AssignImmersion.css';

const AssignImmersion = ({ onNavigate, role }) => {
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [batchLabel, setBatchLabel] = useState('Batch 1');
  const [maxStudents, setMaxStudents] = useState(10);

  const [query, setQuery] = useState('');

  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [batchesLoading, setBatchesLoading] = useState(false);

  const getAssignedIds = (batchList) => {
    const teacherIds = new Set();
    const studentIds = new Set();

    batchList.forEach((batch) => {
      if (batch.teacher?.id) {
        teacherIds.add(Number(batch.teacher.id));
      }

      (batch.students || []).forEach((student) => {
        if (student.id) {
          studentIds.add(Number(student.id));
        }
      });
    });

    return { teacherIds, studentIds };
  };

  const filteredStudents = useMemo(() => {
    const q = (query ?? '').toString().toLowerCase().trim();
    if (!q) return students;

    return students.filter((s) => {
      const id = (s.student_id ?? '').toString().toLowerCase();
      const strand = (s.strand ?? '').toString().toLowerCase();
      const name = `${s.first_name ?? ''} ${s.last_name ?? ''}`.toLowerCase();
      const email = (s.email ?? '').toString().toLowerCase();

      return id.includes(q) || strand.includes(q) || name.includes(q) || email.includes(q);
    });
  }, [query, students]);

  const fetchBatches = async () => {
    try {
      setBatchesLoading(true);
      const res = await api.get('/api/immersion/batches/coordinator/me');
      const nextBatches = (res && res.batches) || [];
      setBatches(nextBatches);
      return nextBatches;
    } catch (e) {
      // don’t hard fail the whole page
      console.error(e);
      return [];
    } finally {
      setBatchesLoading(false);
    }
  };

  const fetchInitial = async () => {
    try {
      setLoading(true);
      setError('');

      const [teacherRes, studentRes] = await Promise.all([
        api.get('/api/immersion/teachers'),
        api.get('/api/immersion/students/requirements-completed'),
      ]);

      const existingBatches = await fetchBatches();
      const { teacherIds, studentIds } = getAssignedIds(existingBatches);

      setTeachers(((teacherRes && teacherRes.teachers) || []).filter((teacher) => (
        !teacherIds.has(Number(teacher.id))
      )));

      // only students with completed requirements can be assigned
      const all = (studentRes && studentRes.students) || [];
      setStudents(all.filter((student) => (
        !studentIds.has(Number(student.id))
      )));
    } catch (e) {
      setError(e.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitial();
  }, []);

  const handleToggleStudent = (studentId) => {
    setSelectedStudentIds((prev) => {
      const set = new Set(prev);
      if (set.has(studentId)) set.delete(studentId);
      else set.add(studentId);
      return Array.from(set);
    });
  };

  const handleAssignSubmittedRefresh = async (assignedStudentIds, teacherId) => {
    setSelectedStudentIds([]);
    setBatchLabel('Batch 1');
    setMaxStudents(10);

    if (teacherId) {
      setTeachers((prev) => prev.filter((t) => t.id !== teacherId));
      setSelectedTeacherId('');
    }
    if (assignedStudentIds && assignedStudentIds.length > 0) {
      setStudents((prev) => prev.filter((s) => !assignedStudentIds.includes(s.id)));
    }

    await fetchBatches();
  };

  const handleDeleteBatch = async (batchId) => {
    if (!window.confirm('Are you sure you want to delete this batch? This will also remove all student assignments.')) {
      return;
    }

    const batch = batches.find((b) => b.id === batchId);

    try {
      await api.delete(`/api/immersion/batches/${batchId}`);
      setBatches((prev) => prev.filter((b) => b.id !== batchId));

      if (batch) {
        if (batch.teacher) {
          setTeachers((prev) => {
            const exists = prev.some((t) => t.id === batch.teacher.id);
            if (exists) return prev;
            return [...prev, batch.teacher];
          });
        }

        if (batch.students && batch.students.length > 0) {
          setStudents((prev) => {
            const existingIds = new Set(prev.map((s) => s.id));
            const toAdd = batch.students
              .filter((s) => !existingIds.has(s.id))
              .map((s) => ({
                id: s.id,
                student_id: s.student_id,
                first_name: s.first_name,
                last_name: s.last_name,
                email: s.email,
                strand: s.strand,
                status: 'approved',
                requirements_status: 'Completed',
                progress: 100,
              }));
            return [...prev, ...toAdd];
          });
        }
      }
    } catch (e) {
      setError(e.message || 'Failed to delete batch.');
    }
  };

  const handleCreateBatchAndAssign = async () => {
    if (!selectedTeacherId) {
      setError('Please select a teacher.');
      return;
    }

    const max = Number(maxStudents);
    if (!Number.isInteger(max) || max <= 0) {
      setError('Max students must be a positive number.');
      return;
    }

    if (selectedStudentIds.length === 0) {
      setError('Please select at least one student with completed requirements.');
      return;
    }

    if (selectedStudentIds.length > max) {
      setError(`Selected students exceed capacity. Max: ${max}`);
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // 1) create batch for teacher
      const created = await api.post('/api/immersion/batches', {
        teacher_id: Number(selectedTeacherId),
        batch_label: batchLabel,
        max_students: max,
      });

      const batchId = created?.batch?.id;
      if (!batchId) throw new Error('Batch created but id missing.');

      // 2) assign students with completed requirements (replace)
      await api.post(`/api/immersion/batches/${batchId}/students`, {
        student_ids: selectedStudentIds,
      });

      await handleAssignSubmittedRefresh(selectedStudentIds, Number(selectedTeacherId));
    } catch (e) {
      setError(e.message || 'Failed to assign students.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="coordinator-layout">
      <Sidebar
        activeItem="assign-immersion"
        onNavigate={onNavigate}
        onLogout={() => onNavigate?.('login')}
        role={role}
      />

      <div className="coordinator-main">
        <div className="coordinator-header">
          <h1>Assign Immersion</h1>
          <p>Create teacher batches and assign students with completed requirements.</p>
        </div>

        {error && <div className="assign-error">{error}</div>}

        <div className="assign-card">
          <div className="assign-grid">
            <div className="field">
              <label>Teacher</label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="select"
              >
                <option value="">Select teacher</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.first_name} {t.last_name} ({t.employee_id || t.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Batch Label</label>
              <input
                className="input"
                value={batchLabel}
                onChange={(e) => setBatchLabel(e.target.value)}
                placeholder="Batch 1"
              />
            </div>

            <div className="field">
              <label>Capacity (max students)</label>
              <input
                className="input"
                type="number"
                min={1}
                value={maxStudents}
                onChange={(e) => setMaxStudents(e.target.value)}
              />
            </div>
          </div>

          <div className="assign-toolbar">
            <h2>Completed Requirements ({filteredStudents.length})</h2>
            <input
              className="search-input"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by ID, strand, name, or gmail..."
              aria-label="Search students"
            />
          </div>

          {loading ? (
            <p className="empty-state">Loading...</p>
          ) : filteredStudents.length === 0 ? (
            <p className="empty-state">No students with completed requirements found.</p>
          ) : (
            <div className="students-select-list">
              {filteredStudents.map((s) => {
                const checked = selectedStudentIds.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={`student-row ${checked ? 'checked' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleStudent(s.id)}
                    />
                    <span className="student-meta">
                      <span className="student-main">
                        <strong className="mono">{s.student_id}</strong> {s.first_name} {s.last_name}
                      </span>
                      <span className="student-sub">
                        {s.strand} • {s.email} • Requirements: {s.requirements_status || 'Completed'}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          <div className="assign-footer">
            <div className="capacity-note">
              Selected: <strong>{selectedStudentIds.length}</strong> / {maxStudents}
            </div>
            <button
              className="btn-primary"
              onClick={handleCreateBatchAndAssign}
              disabled={submitting || loading}
            >
              {submitting ? 'Assigning...' : 'Create Batch & Assign Selected'}
            </button>
          </div>
        </div>

        <div className="batches-section">
          <div className="batches-header">
            <h2>Your Created Batches</h2>
            <p>{batchesLoading ? 'Loading batches...' : `Total: ${batches.length}`}</p>
          </div>

          {batchesLoading ? (
            <p className="empty-state" style={{ padding: 16 }}>Loading...</p>
          ) : batches.length === 0 ? (
            <p className="empty-state" style={{ padding: 16 }}>No batches created yet.</p>
          ) : (
            <div className="batches-table-wrapper">
              <table className="batches-table">
                 <thead>
                   <tr>
                     <th>Batch</th>
                     <th>Teacher</th>
                     <th>Capacity</th>
                     <th>Assigned Students</th>
                     <th>Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {batches.map((b) => (
                     <tr key={b.id}>
                       <td>
                         <div className="batch-label">{b.batch_label}</div>
                         <div className="batch-id mono">ID: {b.id}</div>
                       </td>
                       <td>
                         {b.teacher?.first_name} {b.teacher?.last_name}
                       </td>
                       <td>{b.max_students}</td>
                       <td>
                         <ul className="batch-student-list">
                           {(b.students || []).slice(0, 6).map((st) => (
                             <li key={st.student_id}>{st.student_id}</li>
                           ))}
                           {(b.students || []).length > 6 && (
                             <li className="muted">+{(b.students || []).length - 6} more</li>
                           )}
                         </ul>
                       </td>
                       <td>
                         <button
                           className="btn-delete-batch"
                           onClick={() => handleDeleteBatch(b.id)}
                           title="Delete batch"
                         >
                           Delete
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignImmersion;
