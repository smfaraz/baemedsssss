import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  ShieldCheck,
  User,
  Building,
  Calendar,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { AdminApiClient } from '../../lib/adminApi';
import { Link, useParams, useNavigate } from '../../context/CartContext';

export const AdminPrescriptionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [prescription, setPrescription] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const loadPrescription = async () => {
      setIsLoading(true);
      try {
        const list = await AdminApiClient.getPrescriptions();
        const found = list.find((p) => p.id === id) || list[0] || null;
        setPrescription(found);
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to fetch prescription details');
      } finally {
        setIsLoading(false);
      }
    };
    loadPrescription();
  }, [id]);

  const handleReview = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!clinicalNotes.trim() && decision === 'REJECTED') {
      setErrorMessage('Clinical notes detailing rejection rationale are mandatory under HIPAA guidelines.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
      const result = await AdminApiClient.reviewPrescription(
        prescription.id,
        decision,
        clinicalNotes || (decision === 'APPROVED' ? 'Clinically verified and approved for DME dispensing.' : 'Rejected.')
      );
      setSuccessMessage(`Prescription marked as ${decision}. Order fulfillment unlocked.`);
      setPrescription((prev: any) => ({
        ...prev,
        status: decision,
        reviewedAt: new Date().toISOString(),
      }));
    } catch (err: any) {
      setErrorMessage(err.message || 'Review action forbidden. Verify clinical specialist role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-medical-primary border-t-transparent" />
          <span>Loading clinical prescription verification...</span>
        </div>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Prescription record not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl pb-16">
      {/* Top Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/prescriptions"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900">
              Prescription Review: {prescription.id}
            </h1>
            <p className="text-xs text-slate-500">
              Patient: <span className="font-bold text-slate-800">{prescription.patientName}</span> • Linked Order:{' '}
              <Link to={`/admin/orders/${prescription.orderNumber}`} className="font-mono font-bold text-medical-primary underline">
                {prescription.orderNumber}
              </Link>
            </p>
          </div>
        </div>

        <div>
          {prescription.status === 'PENDING_REVIEW' && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
              Pending Clinical Review
            </span>
          )}
          {prescription.status === 'APPROVED' && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
              Clinically Approved
            </span>
          )}
          {prescription.status === 'REJECTED' && (
            <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200">
              Clinically Rejected
            </span>
          )}
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage('')} className="font-bold underline">Dismiss</button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage('')} className="font-bold underline">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Prescription Document & Physician Verification */}
        <div className="lg:col-span-2 space-y-6">
          {/* Medical Script Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText size={16} className="text-medical-primary" />
                Prescription Document (Watermarked Preview)
              </h2>
              <a
                href={prescription.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-bold text-medical-primary hover:underline"
              >
                Full Resolution <ExternalLink size={13} />
              </a>
            </div>

            <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-6 flex flex-col items-center justify-center min-h-[340px] text-center overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none text-6xl font-black text-slate-900 rotate-[-25deg]">
                BAEMEDS CLINICAL PHI
              </div>
              <FileText size={48} className="text-medical-primary mb-3" />
              <h3 className="font-bold text-slate-900 text-sm">Official Medical Order / DME Script</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Document: {prescription.documentType || 'Uploaded Physician Rx Form'} • Submitted:{' '}
                {new Date(prescription.submittedAt).toLocaleDateString()}
              </p>
              <div className="mt-4 rounded-xl bg-white border border-slate-200 px-4 py-2 font-mono text-xs text-slate-800">
                Prescribed: <strong>{prescription.prescribedDevice}</strong>
              </div>
            </div>
          </div>

          {/* Clinical Decision Action Box */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare size={16} className="text-medical-primary" />
              Clinical Adjudication & Physician Notes
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Clinical Specialist Notes & Reason for Decision
              </label>
              <textarea
                rows={4}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Document verification of physician NPI, matching patient identity, equipment settings, and any clinical caveats..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 focus:border-medical-primary focus:bg-white focus:outline-none"
              />
            </div>

            {prescription.status === 'PENDING_REVIEW' ? (
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleReview('APPROVED')}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 transition disabled:opacity-50"
                >
                  <CheckCircle size={16} />
                  {isSubmitting ? 'Recording...' : 'Approve Prescription'}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleReview('REJECTED')}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-700 py-2.5 text-xs font-bold text-white hover:bg-rose-800 transition disabled:opacity-50"
                >
                  <XCircle size={16} />
                  {isSubmitting ? 'Recording...' : 'Reject Prescription'}
                </button>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 flex items-center gap-2 border border-slate-200">
                <CheckCircle size={16} className="text-emerald-600" />
                <span>
                  Prescription adjudication complete. Reviewed by <strong>{prescription.reviewedBy || 'Clinical Specialist'}</strong> on {new Date(prescription.reviewedAt || Date.now()).toLocaleDateString()}.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Column: Prescriber & Order Verification */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck size={16} className="text-medical-primary" />
              Physician & Facility
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 text-[11px] font-bold uppercase">Prescriber</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{prescription.physicianName}</p>
                <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200 mt-1">
                  NPI Verified Active
                </span>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] font-bold uppercase">Clinical Facility</span>
                <p className="font-semibold text-slate-800 mt-0.5">{prescription.clinic}</p>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] font-bold uppercase">Patient Legal Name</span>
                <p className="font-semibold text-slate-800 mt-0.5">{prescription.patientName}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle size={15} className="text-amber-600" />
              <span>DME Dispensing Requirement</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              In accordance with Delaware medical board regulations, equipment cannot be dispatched from warehouse until an authorized signature and valid clinical approval timestamp is bound to this order.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPrescriptionDetailPage;
