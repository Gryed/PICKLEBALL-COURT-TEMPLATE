import { useEffect, useMemo, useState } from 'react'
import type { Settings } from '../types/court'
import type {
  OpenPlayParticipant,
  OpenPlayPaymentMethod,
} from '../types/openPlay'
import {
  deletePaymentProof,
  uploadPaymentProof,
} from '../services/paymentService'
import {
  getPublicCourtOrganizationId,
} from '../services/courtService'
import {
  submitOpenPlayPayment,
} from '../services/openPlayService'

interface OpenPlayPaymentFormProps {
  participant: OpenPlayParticipant
  sessionCourtId: string
  settings: Settings | null
  paymentStatus: 'pending' | 'verified' | 'rejected' | null
  rejectionReason?: string | null
  onSubmitted: () => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function OpenPlayPaymentForm({
  participant,
  sessionCourtId,
  settings,
  paymentStatus,
  rejectionReason,
  onSubmitted,
}: OpenPlayPaymentFormProps) {
  const [paymentMethod, setPaymentMethod] =
    useState<OpenPlayPaymentMethod>('gcash')
  const [transactionReference, setTransactionReference] = useState('')
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [paymentTime, setPaymentTime] = useState(
    new Date().toTimeString().slice(0, 5)
  )
  const [senderName, setSenderName] = useState('')
  const [senderAccount, setSenderAccount] = useState('')
  const [recipientName, setRecipientName] = useState(
    settings?.gcash_name ?? ''
  )
  const [paymentProvider, setPaymentProvider] = useState('GCash')

  useEffect(() => {
    if (
      paymentMethod === 'gcash' &&
      settings?.gcash_name &&
      !recipientName
    ) {
      setRecipientName(settings.gcash_name)
    }
  }, [
    paymentMethod,
    settings?.gcash_name,
    recipientName,
  ])
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = useMemo(() => {
    return (
      !submitting &&
      Boolean(transactionReference.trim()) &&
      Boolean(paymentDate) &&
      Boolean(paymentTime) &&
      Boolean(senderName.trim()) &&
      Boolean(senderAccount.trim()) &&
      Boolean(recipientName.trim()) &&
      Boolean(proofFile)
    )
  }, [
    submitting,
    transactionReference,
    paymentDate,
    paymentTime,
    senderName,
    senderAccount,
    recipientName,
    proofFile,
  ])

  function handlePaymentMethodChange(
    method: OpenPlayPaymentMethod
  ) {
    setPaymentMethod(method)

    if (method === 'gcash') {
      setPaymentProvider('GCash')
      setRecipientName(settings?.gcash_name ?? '')
    } else if (method === 'bank_transfer') {
      setPaymentProvider('Bank Transfer')
      setRecipientName('')
    } else {
      setPaymentProvider('Other')
      setRecipientName('')
    }
  }

  function handleFileChange(file: File | undefined) {
    setError(null)

    if (!file) {
      setProofFile(null)
      return
    }

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setProofFile(null)
      setError('Please upload a JPG, PNG, or WEBP payment screenshot.')
      return
    }

    if (file.size > MAX_FILE_SIZE) {
      setProofFile(null)
      setError('Payment proof must not exceed 10 MB.')
      return
    }

    setProofFile(file)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submitting) return

    if (!proofFile) {
      setError('Please upload your payment proof.')
      return
    }

    if (!sessionCourtId) {
      setError('The Open Play court could not be identified.')
      return
    }

    setSubmitting(true)
    setError(null)

    let proofPath: string | null = null

    try {
      const organizationId =
        await getPublicCourtOrganizationId(sessionCourtId)

      const idPrefix = crypto.randomUUID()

      proofPath = await uploadPaymentProof(
        proofFile,
        idPrefix,
        organizationId
      )

      await submitOpenPlayPayment({
        participant_id: participant.id,
        payment_method: paymentMethod,
        amount: Number(participant.amount_due),
        transaction_reference: transactionReference.trim(),
        payment_date: paymentDate,
        payment_time: paymentTime,
        sender_name: senderName.trim(),
        sender_account: senderAccount.trim(),
        recipient_name: recipientName.trim(),
        proof_url: proofPath,
        payment_provider: paymentProvider,
        provider_transaction_id: transactionReference.trim(),
      })

      setProofFile(null)
      setTransactionReference('')
      onSubmitted()
    } catch (err) {
      if (proofPath) {
        try {
          await deletePaymentProof(proofPath)
        } catch (cleanupError) {
          console.error(
            'Failed to clean up Open Play payment proof:',
            cleanupError
          )
        }
      }

      setError(
        err instanceof Error
          ? err.message
          : 'Failed to submit payment. Please try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (paymentStatus === 'pending') {
    return (
      <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-5">
        <h3 className="text-lg font-semibold text-white">
          Payment Under Review
        </h3>

        <p className="mt-2 text-sm text-slate-300">
          Your payment proof has been submitted and is waiting for
          verification.
        </p>

        <div className="mt-4 rounded-lg bg-slate-900/50 p-4">
          <div className="text-sm text-slate-400">
            Amount submitted
          </div>
          <div className="mt-1 text-xl font-bold text-white">
            ₱{Number(participant.amount_due).toFixed(2)}
          </div>
        </div>
      </div>
    )
  }

  if (paymentStatus === 'verified') {
    return (
      <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-5">
        <h3 className="text-lg font-semibold text-white">
          Payment Verified
        </h3>

        <p className="mt-2 text-sm text-slate-300">
          Your Open Play payment has been verified. Your participation
          is confirmed.
        </p>

        <div className="mt-4 text-xl font-bold text-white">
          ₱{Number(participant.amount_due).toFixed(2)}
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl border border-white/10 bg-slate-900/60 p-5"
    >
      <div>
        <h3 className="text-lg font-semibold text-white">
          {paymentStatus === 'rejected'
            ? 'Resubmit Payment'
            : 'Complete Payment'}
        </h3>

        <p className="mt-1 text-sm text-slate-400">
          Submit your payment details and screenshot before your
          reservation hold expires.
        </p>
      </div>

      {paymentStatus === 'rejected' && (
        <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-4">
          <div className="font-medium text-red-200">
            Previous payment was rejected
          </div>

          {rejectionReason && (
            <p className="mt-1 text-sm text-red-100/80">
              {rejectionReason}
            </p>
          )}
        </div>
      )}

      <div className="rounded-lg bg-slate-950/60 p-4">
        <div className="text-sm text-slate-400">
          Amount Due
        </div>

        <div className="mt-1 text-2xl font-bold text-white">
          ₱{Number(participant.amount_due).toFixed(2)}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">
          Payment Method
        </label>

        <select
          value={paymentMethod}
          onChange={(event) =>
            handlePaymentMethodChange(
              event.target.value as OpenPlayPaymentMethod
            )
          }
          disabled={submitting}
          className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 text-white outline-none"
        >
          <option value="gcash">GCash</option>
          <option value="bank_transfer">Bank Transfer</option>
          <option value="other">Other</option>
        </select>
      </div>

      {paymentMethod === 'gcash' && settings?.gcash_name && (
        <div className="rounded-lg border border-white/10 bg-slate-950/50 p-4">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            GCash Recipient
          </div>

          <div className="mt-1 font-medium text-white">
            {settings.gcash_name}
          </div>

          {settings.gcash_number && (
            <div className="mt-1 text-sm text-slate-400">
              {settings.gcash_number}
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Payment Date
          </label>

          <input
            type="date"
            value={paymentDate}
            onChange={(event) => setPaymentDate(event.target.value)}
            disabled={submitting}
            required
            className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 text-white"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Payment Time
          </label>

          <input
            type="time"
            value={paymentTime}
            onChange={(event) => setPaymentTime(event.target.value)}
            disabled={submitting}
            required
            className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 text-white"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">
          Transaction Reference
        </label>

        <input
          type="text"
          value={transactionReference}
          onChange={(event) =>
            setTransactionReference(event.target.value)
          }
          disabled={submitting}
          placeholder="Reference / transaction number"
          required
          className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 text-white placeholder:text-slate-600"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Sender Name
          </label>

          <input
            type="text"
            value={senderName}
            onChange={(event) => setSenderName(event.target.value)}
            disabled={submitting}
            placeholder="Name on payment account"
            required
            className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 text-white placeholder:text-slate-600"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200">
            Sender Account
          </label>

          <input
            type="text"
            value={senderAccount}
            onChange={(event) =>
              setSenderAccount(event.target.value)
            }
            disabled={submitting}
            placeholder="GCash number / account"
            required
            className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 text-white placeholder:text-slate-600"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">
          Recipient Name
        </label>

        <input
          type="text"
          value={recipientName}
          onChange={(event) =>
            setRecipientName(event.target.value)
          }
          disabled={submitting}
          placeholder="Payment recipient"
          required
          className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2.5 text-white placeholder:text-slate-600"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-200">
          Payment Proof
        </label>

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={submitting}
          required
          onChange={(event) =>
            handleFileChange(event.target.files?.[0])
          }
          className="block w-full rounded-lg border border-white/10 bg-slate-950 p-2 text-sm text-slate-300 file:mr-4 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:text-white"
        />

        <p className="mt-2 text-xs text-slate-500">
          JPG, PNG, or WEBP. Maximum 10 MB.
        </p>

        {proofFile && (
          <p className="mt-2 text-sm text-emerald-300">
            Selected: {proofFile.name}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg bg-lime-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? 'Submitting Payment...' : 'Submit Payment'}
      </button>
    </form>
  )
}

