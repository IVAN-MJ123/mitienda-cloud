import React, { useEffect, useRef, useState, useCallback } from 'react'
import Quagga from '@ericblade/quagga2'
import { X, Zap, Keyboard, AlertCircle, Sparkles } from 'lucide-react'

const sonarBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(2200, audioCtx.currentTime)
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08)
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start()
    osc.stop(audioCtx.currentTime + 0.08)
  } catch (e) {}
}

// Validación suave: solo longitud mínima y dígitos si aplica
const esCodigoValido = (codigo) => {
  if (!codigo) return false
  if (codigo.length < 7) return false
  // Si es numérico puro, validar checksum SOLO para EAN-13/UPC-A
  // (los demás formatos se aceptan tal cual)
  if (/^\d+$/.test(codigo)) {
    if (codigo.length === 13) {
      let suma = 0
      for (let i = 0; i < 12; i++) {
        suma += (i % 2 === 0 ? 1 : 3) * parseInt(codigo[i], 10)
      }
      const dc = (10 - (suma % 10)) % 10
      return dc === parseInt(codigo[12], 10)
    }
    if (codigo.length === 12) {
      let suma = 0
      for (let i = 0; i < 11; i++) {
        suma += (i % 2 === 0 ? 3 : 1) * parseInt(codigo[i], 10)
      }
      const dc = (10 - (suma % 10)) % 10
      return dc === parseInt(codigo[11], 10)
    }
    if (codigo.length === 8) {
      let suma = 0
      for (let i = 0; i < 7; i++) {
        suma += (i % 2 === 0 ? 3 : 1) * parseInt(codigo[i], 10)
      }
      const dc = (10 - (suma % 10)) % 10
      return dc === parseInt(codigo[7], 10)
    }
  }
  return true
}

export default function Scanner({ onDetectado, onCerrar }) {
  const [error, setError] = useState('')
  const [codigoManual, setCodigoManual] = useState('')
  const [iniciando, setIniciando] = useState(true)

  const visorRef = useRef(null)
  const yaDetectoRef = useRef(false)
  const montadoRef = useRef(true)

  // Buffer de consenso
  const bufferRef = useRef({ codigo: '', repeticiones: 0, marcaTiempo: 0 })

  const detener = useCallback(() => {
    montadoRef.current = false
    try {
      Quagga.offDetected()
      Quagga.stop()
    } catch (e) {}
  }, [])

  const cerrar = useCallback(() => {
    detener()
    if (onCerrar) onCerrar()
  }, [detener, onCerrar])

  useEffect(() => {
    montadoRef.current = true
    yaDetectoRef.current = false
    bufferRef.current = { codigo: '', repeticiones: 0, marcaTiempo: 0 }

    const temporizador = setTimeout(() => {
      if (!visorRef.current || !montadoRef.current) return

      try {
        Quagga.stop()
      } catch (e) {}

      Quagga.init(
        {
          inputStream: {
            name: 'Live',
            type: 'LiveStream',
            target: visorRef.current,
            constraints: {
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          },
          numOfWorkers: 0,
          locate: true,
          // Configuración equilibrada: la que SÍ funcionaba
          locator: {
            halfSample: true,
            patchSize: 'medium'
          },
          frequency: 10,
          decoder: {
            readers: [
              'ean_reader',
              'ean_8_reader',
              'code_128_reader',
              'code_39_reader',
              'upc_reader',
              'upc_e_reader'
            ],
            multiple: false
          }
        },
        (err) => {
          if (!montadoRef.current) {
            try { Quagga.stop() } catch (e) {}
            return
          }

          if (err) {
            console.error('Error al iniciar Quagga2:', err)
            setIniciando(false)
            setError('No se pudo iniciar el escáner. Usa el ingreso manual.')
            return
          }

          try {
            Quagga.start()
            if (montadoRef.current) setIniciando(false)
          } catch (startErr) {
            console.error('Error al arrancar Quagga:', startErr)
          }
        }
      )

      Quagga.onDetected((resultado) => {
        if (!montadoRef.current || yaDetectoRef.current) return
        if (!resultado?.codeResult?.code) return

        const codigo = resultado.codeResult.code

        // FILTRO 1: Longitud mínima + checksum suave
        if (!esCodigoValido(codigo)) return

        // FILTRO 2: Consenso - el mismo código debe leerse 2 veces en menos de 800ms
        const ahora = Date.now()
        const buffer = bufferRef.current

        if (buffer.codigo === codigo && (ahora - buffer.marcaTiempo) < 800) {
          buffer.repeticiones += 1
          buffer.marcaTiempo = ahora
        } else {
          bufferRef.current = { codigo, repeticiones: 1, marcaTiempo: ahora }
          return
        }

        // Confirmar con 2 lecturas seguidas
        if (buffer.repeticiones >= 2) {
          yaDetectoRef.current = true
          sonarBeep()
          if (navigator.vibrate) navigator.vibrate(80)

          detener()
          if (onDetectado) onDetectado(codigo)
          if (onCerrar) onCerrar()
        }
      })
    }, 150)

    return () => {
      clearTimeout(temporizador)
      detener()
    }
  }, [detener, onDetectado, onCerrar])

  const manejarManual = (e) => {
    e.preventDefault()
    if (!codigoManual.trim()) return

    sonarBeep()
    if (navigator.vibrate) navigator.vibrate(40)
    detener()
    if (onDetectado) onDetectado(codigoManual.trim())
    if (onCerrar) onCerrar()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) cerrar()
      }}
    >
      <style>{`
        #quagga-contenedor video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 1.25rem !important;
        }
        #quagga-contenedor canvas {
          display: none !important;
        }
      `}</style>

      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-sm rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-fade-in max-h-[92vh]">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-yellow-400/10 text-yellow-400 rounded-xl">
              <Zap size={18} />
            </span>
            <div>
              <span className="font-bold text-white text-sm block">Escáner Multidireccional</span>
              <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                <Sparkles size={11} /> Motor Quagga2
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={cerrar}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-300 hover:text-white active:scale-90 transition-transform cursor-pointer"
            aria-label="Cerrar escáner"
          >
            <X size={18} />
          </button>
        </div>

        {/* Visor de Cámara */}
        <div className="p-4 flex flex-col items-center justify-center shrink-0">
          <div className="relative w-full h-[220px] bg-black rounded-2xl overflow-hidden border border-slate-700 shadow-inner flex items-center justify-center">
            <div id="quagga-contenedor" ref={visorRef} className="w-full h-full relative" />

            {iniciando && !error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 text-slate-300">
                <div className="w-7 h-7 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mb-2" />
                <span className="text-xs font-medium">Iniciando sensor...</span>
              </div>
            )}

            {!error && !iniciando && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                <div className="w-[88%] h-[140px] border-2 border-yellow-400/80 rounded-2xl relative flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.15)]">
                  <div className="w-full h-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,1)] animate-pulse" />
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-300 text-xs mt-3 text-center bg-red-950/50 p-2.5 rounded-xl border border-red-800/50 w-full justify-center">
              <AlertCircle size={15} className="shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <p className="text-[11px] text-slate-400 mt-2.5 font-medium text-center">
            Apunta a cualquier código de barras sin importar su inclinación
          </p>
        </div>

        {/* Ingreso Manual y Cancelar */}
        <div className="px-4 pb-4 pt-1 bg-slate-900 border-t border-slate-800/80 space-y-2.5 shrink-0">
          <form onSubmit={manejarManual} className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={codigoManual}
              onChange={(e) => setCodigoManual(e.target.value)}
              placeholder="O escribe el código manual..."
              className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 transition-all"
            />
            <button
              type="submit"
              disabled={!codigoManual.trim()}
              className="bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              <Keyboard size={14} /> Listo
            </button>
          </form>

          <button
            type="button"
            onClick={cerrar}
            className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 active:scale-95 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer text-center"
          >
            Cancelar y Volver
          </button>
        </div>
      </div>
    </div>
  )
}