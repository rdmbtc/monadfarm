import { useNicknames } from 'react-together'
import { useState } from 'react'

function NicknameEditor() {
  const [nickname, setNickname] = useNicknames()
  const [input, setInput] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      setNickname(input.trim())
      setInput('')
    }
  }

  return (
    <div className="bg-white p-4 rounded shadow">
      <h3 className="font-semibold mb-2">Your Nickname</h3>
      <p className="text-sm text-gray-600 mb-3">
        Current: <strong>{nickname}</strong>
      </p>
      
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter new nickname"
          className="flex-1 border border-gray-300 rounded px-3 py-2"
          maxLength={20}
        />
        <button
          type="submit"
          disabled={!input.trim() || input.trim() === nickname}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Update
        </button>
      </form>
    </div>
  )
}

export default NicknameEditor
