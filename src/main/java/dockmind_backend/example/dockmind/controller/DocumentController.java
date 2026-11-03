package dockmind_backend.example.dockmind.controller;


import dockmind_backend.example.dockmind.dto.ApiResponse;
import dockmind_backend.example.dockmind.dto.DocumentMetadataDto;
import dockmind_backend.example.dockmind.dto.DocumentResponseDto;
import dockmind_backend.example.dockmind.service.DocumentMetadataService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController()
@RequestMapping("/api/v1/documents")
@Tag(
        name="Document Management",
        description="Endpoint for uploading, listing and managing documents and their vector embeddings"
)
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentMetadataService documentMetadataService; // for final fields create constructor ato

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)  // what http request contains type =file, json ,image specifies by media type
    @Operation(
            summary = "Upload and index a document(PDF, DOCX, TEXT)",
            description = "This api is used to upload and index documents files"
    )
    public ResponseEntity<ApiResponse> uploadDocument(@RequestParam("file") MultipartFile file) {
        DocumentResponseDto documentResponseDto= this.documentMetadataService.uploadAndProcess(file);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<DocumentResponseDto>builder()
                        .success(true)
                        .data(documentResponseDto)
                        .timestamp(LocalDateTime.now())
                        .message("Document uploaded and indexed successfully")
                        .build()
                );
    }

    @PostMapping(value = "/upload-multiple",consumes =  MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
            summary= "Upload and index multiple documents simultaneously",
            description = "This api is used to upload and index multiple documents"

    )
    public ResponseEntity<ApiResponse> uploadMultiple(@RequestParam("files") List<MultipartFile> files) {
        List<DocumentResponseDto> responseDtos= documentMetadataService.uploadMultipleDocuments(files);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(
                        ApiResponse.<List<DocumentResponseDto>>builder()
                                .message("Document uplaoded successfully")
                                .success(true)
                                .timestamp(LocalDateTime.now())
                                .data(responseDtos)
                                .build()
                );
    }

    @GetMapping
    @Operation(summary = "List all uploaded documents and their indexing status")
    public ResponseEntity<ApiResponse> getAllDocuments(){
        List<DocumentMetadataDto> documents=documentMetadataService.getAllDocuments();
        return ResponseEntity.ok(
                ApiResponse.<List<DocumentMetadataDto>>builder()
                        .message("All docs feteched successfully")
                        .success(true)
                .timestamp(LocalDateTime.now())
                        .data(documents)
                        .build()
        );
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get metadata of a specific document by ID")
    public ResponseEntity<ApiResponse> getDocumentById(@PathVariable("id") UUID id){
        DocumentMetadataDto document= documentMetadataService.getDocumentById(id);
        return ResponseEntity.ok(ApiResponse.<List<DocumentMetadataDto>>builder()
                .message("Fetched single doc successfully")
                .success(true)
                .timestamp(LocalDateTime.now())
                .data(document)
                .build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a document and purge its vector embeddings from vector store")
    public ResponseEntity<?> deleteDocument(@PathVariable UUID id){
        documentMetadataService.deleteDocument(id);
        return ResponseEntity.ok(ApiResponse.builder()
                .message("Document deleted successfully")
                .success(true)
                .timestamp(LocalDateTime.now())
                .data(null)
                .build()
        );
    }

    @GetMapping("/{id}/chunks")
    @Operation(summary = "Get all chunks for a specific document")
    public ResponseEntity<ApiResponse> getDocumentChunks(@PathVariable("id") UUID id) {
        var chunks = documentMetadataService.getDocumentChunks(id);
        return ResponseEntity.ok(ApiResponse.builder()
                .message("Fetched document chunks successfully")
                .success(true)
                .timestamp(LocalDateTime.now())
                .data(chunks)
                .build());
    }
}
