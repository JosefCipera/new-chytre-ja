import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './index.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="flex justify-center gap-4 my-4">
        <a href="https://vite.dev" target="_blank">
          <img src="/vite.svg" className="w-24 h-24 hover:opacity-80" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="w-24 h-24 hover:opacity-80" alt="React logo" />
        </a>
      </div>
      <h1 className="text-3xl font-bold text-center text-green-600 my-4">Vite + React</h1>
      <div className="max-w-md mx-auto p-6 bg-gray-100 rounded-lg shadow">
        <button
          onClick={() => setCount((count) => count + 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          count is {count}
        </button>
        <p className="mt-2 text-gray-600">
          Edit <code className="bg-gray-200 p-1 rounded">src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="text-center mt-4 text-gray-500">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App