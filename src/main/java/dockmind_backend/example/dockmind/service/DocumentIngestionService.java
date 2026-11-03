package dockmind_backend.example.dockmind.service;



import dockmind_backend.example.dockmind.entity.DocumentStatus;
import dockmind_backend.example.dockmind.exception.DocumentProcessingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import dockmind_backend.example.dockmind.config.AppProperties;
import dockmind_backend.example.dockmind.entity.DocumentMetadata;
import dockmind_backend.example.dockmind.repository.DocumentMetadataRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.document.Document;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.stereotype.Service;
import org.springframework.ai.vectorstore.VectorStore;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

//document converted to vector/embeddings -> store it in database
@Service
@RequiredArgsConstructor
public class DocumentIngestionService {

    private static final Logger log = LoggerFactory.getLogger(DocumentIngestionService.class);

    private final VectorStore vectorStore;

    private final DocumentMetadataRepo documentMetadataRepo;

    private final AppProperties appProperties;

    public int ingest(DocumentMetadata metadata, List<Document> parseDocs){
        log.info(
                "Ingesting documents into DockMind [id={},name={},pages={}]",
                metadata.getId(),
                metadata.getFileName(),
                metadata.getFileSize()
        );
        try{
            metadata.setStatus(DocumentStatus.PROCESSING);
            metadata.setTotalPages(parseDocs.size());

            //1.Text chunking using TokenTextSplitter
            TokenTextSplitter tokenTextSplitter = TokenTextSplitter.builder()
                    .withChunkSize(appProperties.getRag().getChunkSize())
                    .withMinChunkSizeChars(appProperties.getRag().getMinChunksSizeChars())
                    .withMinChunkLengthToEmbed(appProperties.getRag().getMinChunkLengthToEmbed())
                    .withMaxNumChunks(appProperties.getRag().getMaxNumChunks())
                    .withKeepSeparator(true)
                    .build();

            List<Document> chunks= tokenTextSplitter.apply(parseDocs);
            if(chunks.isEmpty()){
                metadata.setStatus(DocumentStatus.FAILED);
                metadata.setErrorMessage("Document appears to be empty");
                documentMetadataRepo.save(metadata);
                return 0;
            }

            //2.Meta data enrichment on each chunk
            List<Document> enrichedChunks= new ArrayList<>();
            for(int i=0;i<chunks.size();i++){
                Document chunk=chunks.get(i);
                Map<String,Object>  enrichedMetadata= new HashMap<>(chunk.getMetadata());
                enrichedMetadata.put("documentId", metadata.getId().toString());
                enrichedMetadata.put("fileName", metadata.getFileName());
                enrichedMetadata.put("contentType", metadata.getContentType());
                enrichedMetadata.put("chunkIndex",i);
                Object pageNumber=chunk.getMetadata().get("pageNumber");
                if(pageNumber==null){
                    pageNumber=chunk.getMetadata().get("pageNumber");
                }
                if(pageNumber!=null){
                    enrichedMetadata.put("pageNumber",pageNumber);
                }

                Document enrichedDoc=new Document(chunk.getText(),enrichedMetadata);
                enrichedChunks.add(enrichedDoc);
            }

            //3.write chunks and embedding to pg vector
            /*Your Vector Store searches for relevant chunks.
            Metadata helps you identify:
            - Which uploaded file contains the chunk.
            - Which user owns the document.
            - Which page contains the information.
            - Which document should be used when filtering search results.*/
            log.info("Writing {} vector chunks to PgVector for document:{}", enrichedChunks.size(), metadata.getFileName());
            vectorStore.add(enrichedChunks);//Document enrichedDoc = new Document(chunk.getText(), enrichedMetadata);

           // 4.Update document status to index
            metadata.setStatus(DocumentStatus.INDEXED);
            metadata.setTotalChunks(enrichedChunks.size());
            metadata.setErrorMessage(null);
            documentMetadataRepo.save(metadata);
            log.info("DockMind document:{} has been successfully indexed", metadata.getFileName());
            return enrichedChunks.size();
        }
        catch(Exception e){
            log.error("Failed to ingest documents into vector store",metadata.getFileName(),e);
            metadata.setStatus(DocumentStatus.FAILED);
            metadata.setErrorMessage(e.getMessage());
            documentMetadataRepo.save(metadata);
            throw new DocumentProcessingException("Failed to index document:"+ e.getMessage(),e);
        }
    }
}
