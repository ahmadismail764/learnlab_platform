/**
 * App.tsx - Root Application Component
 * 
 * This is a minimal test component to verify Tailwind CSS configuration.
 * Will be replaced with proper routing and layout structure.
 */

function App() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-primary-600 mb-2">
          🎓 Learn Lab
        </h1>
        <p className="text-neutral-600 text-lg">
          Educational LMS Platform
        </p>
      </div>

      {/* Test Card */}
      <div className="card max-w-md w-full mb-6">
        <h2 className="text-xl font-semibold text-neutral-800 mb-4">
          Tailwind CSS Test
        </h2>
        <p className="text-neutral-600 mb-4">
          If you can see styled colors and rounded corners, Tailwind is working! ✅
        </p>
        
        {/* Color Palette Test */}
        <div className="flex gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-primary-500" title="Primary" />
          <div className="w-8 h-8 rounded-full bg-secondary-500" title="Secondary" />
          <div className="w-8 h-8 rounded-full bg-accent-500" title="Accent" />
          <div className="w-8 h-8 rounded-full bg-success" title="Success" />
          <div className="w-8 h-8 rounded-full bg-warning" title="Warning" />
          <div className="w-8 h-8 rounded-full bg-error" title="Error" />
        </div>

        {/* Button Tests */}
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary">Primary</button>
          <button className="btn-secondary">Secondary</button>
          <button className="btn-outline">Outline</button>
        </div>
      </div>

      {/* Input Test */}
      <div className="card max-w-md w-full">
        <label className="block text-sm font-medium text-neutral-700 mb-1">
          Test Input
        </label>
        <input 
          type="text" 
          className="input" 
          placeholder="Type something..."
        />
      </div>

      {/* Footer */}
      <p className="text-neutral-400 text-sm mt-8">
        Ready for development 🚀
      </p>
    </div>
  )
}

export default App
