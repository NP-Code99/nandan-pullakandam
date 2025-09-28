import { useMutation } from '@tanstack/react-query'
import { createItem } from '../lib/api'
import { useState } from 'react'
import { z } from 'zod'

// Client-side validation schema
const itemSchema = z.object({
  text: z.string().min(1, 'Text is required').max(500, 'Text must be less than 500 characters')
})

export function AddItem({ onAdded }: { onAdded: () => void }) {
  const [text, setText] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  
  const mutation = useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      setText('')
      setValidationError(null)
      onAdded()
    },
    onError: (error) => {
      console.error('Failed to create item:', error)
    }
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = text.trim()
    
    // Client-side validation
    try {
      itemSchema.parse({ text: trimmed })
      setValidationError(null)
      mutation.mutate(trimmed)
    } catch (error) {
      if (error instanceof z.ZodError) {
        setValidationError(error.issues[0]?.message || 'Validation error')
      }
    }
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            // Clear validation error when user starts typing
            if (validationError) setValidationError(null)
          }}
          placeholder="Describe your item"
          style={{ 
            flex: 1, 
            padding: '0.5rem',
            border: validationError ? '1px solid #e74c3c' : '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
        <button 
          type="submit" 
          disabled={mutation.isPending || text.trim().length < 1}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: mutation.isPending ? '#95a5a6' : '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: mutation.isPending ? 'not-allowed' : 'pointer'
          }}
        >
          {mutation.isPending ? 'Adding…' : 'Add'}
        </button>
      </form>
      {validationError && (
        <div style={{ 
          color: '#e74c3c', 
          fontSize: '0.875rem', 
          marginTop: '4px',
          padding: '4px 8px',
          backgroundColor: '#fdf2f2',
          borderRadius: '4px'
        }}>
          {validationError}
        </div>
      )}
      {mutation.isError && (
        <div style={{ 
          color: '#e74c3c', 
          fontSize: '0.875rem', 
          marginTop: '4px',
          padding: '4px 8px',
          backgroundColor: '#fdf2f2',
          borderRadius: '4px'
        }}>
          Failed to add item. Please try again.
        </div>
      )}
    </div>
  )
}


