# Curriculum Photos (GridFS)

## Descripción General

Módulo para adjuntar, listar, ver (stream) y borrar fotos de un Currículum.  
Las imágenes se almacenan en **MongoDB GridFS** (bucket `curriculum_photos`) y el documento `Curriculum` guarda solo **metadatos** en `photos[]` (`fileId`, `filename`, `contentType`, `length`, `uploadDate`, `caption`, `isMain`).



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

##PENDIENTE DE ACTUALIZAR POR EL GRAPHQL