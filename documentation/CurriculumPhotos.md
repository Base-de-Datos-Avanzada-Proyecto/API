# Curriculum Photos (GridFS)

Descripción General

Este módulo gestiona fotos de currículum almacenadas en MongoDB GridFS. Expone campos en Curriculum para listar fotos, obtener la URL pública (stream) y administrar portada, además de mutations para subir, eliminar y marcar como portada.

Las URLs devueltas por GraphQL son rutas REST del servidor (stream de GridFS), por ejemplo:
/api/curricula/files/<fileId> → http://localhost:4000/api/curricula/files/<fileId>

Tipos de Datos
Photo
type Photo {
  fileId: ID!
  filename: String
  contentType: String
  length: Int
  uploadDate: String
  caption: String
  isMain: Boolean
  url: String!      # /api/curricula/files/:fileId
}

Extensiones en Curriculum
extend type Curriculum {
  photos: [Photo!]!
  mainPhotoUrl: String!  # URL de portada o "" si no hay fotos
}


Queries
1) curriculum

Obtiene un currículum con sus fotos y URL de portada.

query GetCurriculumPhotos($id: ID!) {
  curriculum(id: $id) {
    id
    mainPhotoUrl
    photos {
      fileId
      filename
      contentType
      length
      uploadDate
      caption
      isMain
      url
    }
  }
}


Variables

{ "id": "68ad3c50dff12162f05e68e8" }

2) curricula

Lista rápida para ver qué currículos tienen fotos.

query ListCurricula {
  curricula {
    id
    isPublic
    photos { fileId isMain url }
    updatedAt
  }
}

Mutations

1) uploadCurriculumPhoto

Sube una imagen (jpg, png, webp, gif) a GridFS y agrega su metadata en el currículum.
La primera foto queda como isMain: true (portada).

mutation Upload($curriculumId: ID!, $file: Upload!, $caption: String) {
  uploadCurriculumPhoto(curriculumId: $curriculumId, file: $file, caption: $caption) {
    fileId
    filename
    contentType
    length
    uploadDate
    caption
    isMain
    url
  }
}


Cómo adjuntar archivo en Apollo Sandbox

En Variables, pon:

{ "curriculumId": "68ae0b49844769c663be5619", "file": null, "caption": "Foto del CV" }


Click Add files → Key: file → selecciona la imagen.

Ejecuta la mutation.

2) deleteCurriculumPhoto

Elimina la referencia en el currículum y borra el binario de GridFS.

mutation DeletePhoto($curriculumId: ID!, $fileId: ID!) {
  deleteCurriculumPhoto(curriculumId: $curriculumId, fileId: $fileId)
}


Variables

{
  "curriculumId": "68ad3c50dff12162f05e68e8",
  "fileId": "68ade746431fb54fd27dbb4a"
}

3) setCurriculumMainPhoto

Marca una foto existente como portada (isMain: true) y desmarca las demás.

mutation SetMain($curriculumId: ID!, $fileId: ID!) {
  setCurriculumMainPhoto(curriculumId: $curriculumId, fileId: $fileId)
}


Variables

{
  "curriculumId": "68ad3c50dff12162f05e68e8",
  "fileId": "68ade746431fb54fd27dbb4a"
}

## Endpoints (REST)
- **POST** `/api/curricula/:curriculumId/photos` → subir (`photo` = File; acepta jpg/png/webp/gif; máx 5 MB).
- **GET**  `/api/curricula/:curriculumId/photos` → listar metadata (`photos[]`).
- **GET**  `/api/curricula/files/:fileId` → ver (stream) la imagen; incluye `Content-Type` y cache.
- **DELETE** `/api/curricula/:curriculumId/photos/:fileId` → borrar del modelo **y** de GridFS.

## Ejemplos rápidos (cURL)
```bash

# Subir
curl -F "photo=@C:/ruta/imagen.webp" -F "caption=Foto perfil" \
http://localhost:4000/api/curricula/<CURRICULUM_ID>/photos

# Listar
curl http://localhost:4000/api/curricula/<CURRICULUM_ID>/photos

# Ver (solo headers)
curl -I http://localhost:4000/api/curricula/files/<FILE_ID>

# Borrar
curl -X DELETE http://localhost:4000/api/curricula/<CURRICULUM_ID>/photos/<FILE_ID>

------------

✅ Tipos permitidos de imagenes

JPEG/JPG (image/jpeg)
PNG (image/png)
WEBP (image/webp)
GIF (image/gif)

⛔ No aceptados (tal como está)
HEIC/HEIF (típicas de iPhone), SVG, BMP, TIFF, PDF, videos, etc.

📦 Tamaño máximo
5 MB por archivo.

📝 Campo del formulario
 form-data en Postman
