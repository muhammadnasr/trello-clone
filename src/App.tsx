import { HelloWorld } from './components/HelloWorld'
import { StyledComponent } from './components/StyledComponent'

function App() {
  return (
    <div className="min-h-screen p-8 space-y-8">
      <h1 className="text-3xl font-bold">Trello Clone - Test Components</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">HelloWorld Component</h2>
          <HelloWorld />
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-2">StyledComponent (TailwindCSS)</h2>
          <StyledComponent />
        </div>
      </div>
    </div>
  )
}

export default App
