import { useEffect, useState } from 'react'
export function useStorage(key, initial){
  const [val,setVal]=useState(()=>{try{const v=localStorage.getItem(key);return v?JSON.parse(v):initial}catch{return initial}})
  useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(val))}catch{}},[key,val])
  return [val,setVal]
}
