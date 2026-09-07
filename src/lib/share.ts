export async function blobFromUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Gagal mengambil foto");
  return response.blob();
}

export async function downloadPhoto(url: string, filename: string) {
  const blob = await blobFromUrl(url);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function sharePhoto(url: string, filename: string) {
  const blob = await blobFromUrl(url);
  const file = new File([blob], filename, {
    type: blob.type || "image/jpeg",
  });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: "Momen Akad Nikah",
      text: "Foto dari disposable camera akad nikah",
    });
    return;
  }

  if (navigator.share) {
    await navigator.share({
      title: "Momen Akad Nikah",
      text: "Foto dari disposable camera akad nikah",
      url,
    });
    return;
  }

  await downloadPhoto(url, filename);
}
