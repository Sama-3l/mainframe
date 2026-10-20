"use client";

async function handleSubmit(
  event: React.FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  const formData = new FormData(event.currentTarget);

  const response = await fetch("/api/v1/uploads", {
    method: "POST",
    body: formData,
  });

  const text = await response.text();
  console.log("Upload response:", response.status, text);
}

export default function ImageInput() {
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="file"
        name="images"
        accept="image/jpeg,image/png,image/webp"
        multiple
        required
      />
      <button type="submit">Upload image</button>
    </form>
  );
}