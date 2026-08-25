import { useEffect, useState, type ImgHTMLAttributes } from 'react'

type PublicPhotoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string
  fallbackSrc: string
}

export function PublicPhoto({ src, fallbackSrc, onError, ...props }: PublicPhotoProps) {
  const [currentSrc, setCurrentSrc] = useState(src)

  useEffect(() => {
    setCurrentSrc(src)
  }, [src])

  return (
    <img
      {...props}
      src={currentSrc}
      onError={(event) => {
        onError?.(event)
        if (currentSrc !== fallbackSrc) {
          setCurrentSrc(fallbackSrc)
        }
      }}
    />
  )
}
