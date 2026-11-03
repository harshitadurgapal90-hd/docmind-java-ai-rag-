package dockmind_backend.example.dockmind.service;

import dockmind_backend.example.dockmind.dto.DocumentMetadataDto;
import dockmind_backend.example.dockmind.dto.DocumentResponseDto;
import dockmind_backend.example.dockmind.entity.DocumentMetadata;
import dockmind_backend.example.dockmind.entity.DocumentStatus;
import dockmind_backend.example.dockmind.exception.DocumentProcessingException;
import dockmind_backend.example.dockmind.exception.ResourceNotFoundException;
import dockmind_backend.example.dockmind.repository.DocumentMetadataRepo;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.slf4j.Logger;
import org.springframework.ai.document.Document;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;


@Service
@RequiredArgsConstructor
public class DocumentMetadataService {

    private static final Logger log = LoggerFactory.getLogger(DocumentMetadataService.class);
    private final DocumentMetadataRepo documentMetadataRepo;
    private final DocumentIngestionService documentIngestionService;
    private final DocumentParserService documentParserService;
    //for custom query run
    private final JdbcTemplate jdbcTemplate;
    private final ModelMapper modelMapper;

    //method to upload and parse document
    public DocumentResponseDto uploadAndProcess(MultipartFile file) {
        String fileName= file.getOriginalFilename() !=null ? file.getOriginalFilename(): "document";
        String contentType= file.getContentType()!=null ? file.getContentType(): "application/octet-stream";

        //document meta data store of uploaded file
        DocumentMetadata documentMetadata = DocumentMetadata.builder()
                .fileName(fileName)
                .contentType(contentType)
                .status(DocumentStatus.UPLOADING)
                .fileSize(file.getSize())
                .createdAt(LocalDateTime.now())
                .build();

        documentMetadata=documentMetadataRepo.save(documentMetadata);

        int chunksCreated=0;
        List<Document> parsedDocs=null;
        try {
            // parse the file, get the list of document
            parsedDocs= documentParserService.parse(file);

            //ingest service and rerturn number of chunks for compete List<Document> together
            chunksCreated = documentIngestionService.ingest(documentMetadata, parsedDocs);

            // documentMetadata.setTotalChunks(chunksCreated);
            //save the doc meta data
        }
        catch (DocumentProcessingException e){
            documentMetadataRepo.delete(documentMetadata); // if execption while chunkking or parsing remove metadata which was saved before it
            throw e;
        }
        return DocumentResponseDto.builder()
                .id(documentMetadata.getId())
                .fileName(documentMetadata.getFileName())
                .fileSize(documentMetadata.getFileSize())
                .chunksCreated(chunksCreated)
                .status(documentMetadata.getStatus())
                .message("document successfully processed and indexed")
                .build();
    }

    public List<DocumentResponseDto> uploadMultipleDocuments(List<MultipartFile> files) {
        List<DocumentResponseDto> responseDtos = new ArrayList<>();

        for(MultipartFile file : files){
            DocumentResponseDto result=this.uploadAndProcess(file);
            responseDtos.add(result);
        }
        return responseDtos;
    };

    public List<DocumentMetadataDto> getAllDocuments()
    {
       List<DocumentMetadata> allDocuments= documentMetadataRepo.findAllByOrderByCreatedAtDesc();
       return allDocuments.stream()
               .map(documentMetadata -> modelMapper.map(documentMetadata, DocumentMetadataDto.class))
               .toList();
    }


    public DocumentMetadataDto getDocumentById(UUID id)
    {
        DocumentMetadata documentMetadata=documentMetadataRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        return modelMapper.map(documentMetadata, DocumentMetadataDto.class);
    }

    // if i want to delete particular document from document metadata -> first delete its correspondingall chunks in vector_store table from metadata col containeinf the documentId
    public void deleteDocument(UUID id)
    {
        //delete vector entries
        try{
            String deleteVectorSql ="DELETE FROM vector_store WHERE metadata->>'documentId' =?"; //metadata->>'documentId' metadtaa store in JSOn format from it fetch documentId
            int deletedCount=jdbcTemplate.update(deleteVectorSql, id.toString());// of that document Id how many chunks deleted this id will be filled above ?
            log.info("Deleted {} records from vector_store", deletedCount,id);
        }
        catch (Exception e){
            log.warn("could not delete records from vector_store",e.getMessage());
        }
        try {
            documentMetadataRepo.deleteById(id);
            log.info("Deleted document metadata for id {}", id);
        } catch (Exception e) {
            log.warn("Could not delete document metadata: {}", e.getMessage());
        }
    }

    public List<java.util.Map<String, Object>> getDocumentChunks(UUID id) {
        try {
            String query = "SELECT id, content, metadata FROM vector_store WHERE metadata->>'documentId' = ? ORDER BY (metadata->>'chunkIndex')::int ASC";
            return jdbcTemplate.query(query, (rs, rowNum) -> {
                java.util.Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", rs.getString("id"));
                map.put("content", rs.getString("content"));
                map.put("metadata", rs.getString("metadata"));
                return map;
            }, id.toString());
        } catch (Exception e) {
            log.warn("Could not query vector_store for document chunks: {}", e.getMessage());
            return new ArrayList<>();
        }
    }

}
