'use client'

import { useRef, useState } from 'react'
import { createMemory } from '@/app/actions/data'
import { useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
    >
      {pending ? 'Uploading...' : 'Save Memory'}
    </button>
  )
}

export default function UploadForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPreview(URL.createObjectURL(file))
    } else {
      setPreview(null)
    }
  }

  return (
    <form 
      ref={formRef}
      action={async (formData) => {
        await createMemory(formData)
        formRef.current?.reset()
        setPreview(null)
      }} 
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <input type="text" name="title" placeholder="Memory Title" required className="px-4 py-2 border rounded-lg w-full" />
          <textarea name="caption" placeholder="Caption/Story behind the photo..." rows={4} required className="px-4 py-2 border rounded-lg w-full custom-scrollbar"></textarea>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input type="file" name="file" accept="image/*" required onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-rose-50 file:text-rose-700 hover:file:bg-rose-100 cursor-pointer" />
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden h-64 md:h-auto">
          {preview ? (
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <span className="text-gray-400 font-light">Image Preview</span>
          )}
        </div>
      </div>
      
      <SubmitButton />
    </form>
  )
}
