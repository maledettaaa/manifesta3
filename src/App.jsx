import { useState } from 'react'
import './App.css'
import Experience from './Experience/Experience'
import IntroOverlay from './components/IntroOverlay'
//Variabili per il particellare
let particleSystem
let particleGeometry
let particleMaterial
const particleCount = 10000
const particleTexturePath = './assets/textures/circle_05.png'
function App() {
  return (
    <>
      <IntroOverlay />
      <Experience />
    </>
  )
}

export default App
