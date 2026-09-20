"use client";
export default function PrintButton(){
  return <button className="btn no-print" onClick={()=>window.print()}>Imprimir / Salvar PDF</button>
}