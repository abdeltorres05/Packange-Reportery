import { useEffect, useState } from "react";

import { api } from "../api";

export default function AuthImage({ path, alt }) {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl;

    setUrl(null);
    setFailed(false);

    api
      .getBlob(path)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (active) setFailed(true);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [path]);

  if (failed) return <div className="photo-placeholder">No se pudo cargar</div>;
  if (!url) return <div className="photo-placeholder">Cargando…</div>;

  return <img src={url} alt={alt} loading="lazy" />;
}
