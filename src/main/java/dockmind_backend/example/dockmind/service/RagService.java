package dockmind_backend.example.dockmind.service;


import dockmind_backend.example.dockmind.config.AppProperties;
import dockmind_backend.example.dockmind.dto.*;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.document.DocumentMetadata;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.stereotype.Service;
import org.springframework.ai.vectorstore.VectorStore;
import reactor.core.publisher.Flux;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RagService {
    private static final Logger log= LoggerFactory.getLogger(RagService.class);
    private final VectorStore vectorStore;
    private final AppProperties appProperties;
    private final ChatClient chatClient;

    //take question/query any thing related to document -> give to LLM question, matching document retrieved
    public ChatResponseDto askQuestion(ChatRequestDto request){
        long startTime = System.currentTimeMillis();
        log.info("Processing query: '{}', scoped documentId: {}", request.getQuestion(), request.getDocumentId());
        List<Document> similarDocuments = this.retrieveRelevantDocuments( // to fetch convert question-> embedding, retreive releavnt top k base don instruction using vectorsector.retrive
                request.getQuestion(),
                request.getDocumentId(),
                request.getTopK(),
                request.getMinSimilarity()
        );
        List<CitationDto> citationDtos= similarDocuments.stream()
                .map(this::mapToCitation)
                .toList();

        String contextText= buildContextString(similarDocuments);// matching document
        String prompt= buildPrompt(request.getQuestion(),contextText);
        String answer =this.chatClient.prompt()
                .user(prompt)
                .call()
                .content();
        long responseTime= System.currentTimeMillis() - startTime;
        log.info("Response time: {} ms", responseTime,citationDtos.size());
        return ChatResponseDto.builder()
                .answer(answer)
                .conversationId(request.getConversationId()!=null ? request.getConversationId():UUID.randomUUID().toString())
                .citations(citationDtos)
                .responseTimeMs(responseTime)
                .build();
    }

    // to stream things, answer
    public Flux<String> streamQuestionAnswer(ChatRequestDto requestDto){
        log.info("Streaming query: '{}'",requestDto.getQuestion());
        List<Document> relevantDocuments = this.retrieveRelevantDocuments(
                requestDto.getQuestion(),
                requestDto.getDocumentId(),
                requestDto.getTopK(),
                requestDto.getMinSimilarity()
        );

        String contextText= buildContextString(relevantDocuments);
//        String userPrompt= buildPrompt(requestDto.getQuestion(),contextText);
//        return chatClient.prompt()
//                .user(userPrompt)
//                .stream()
//                .content();

        log.info("Retrieved context: {}", contextText);

        String userPrompt = buildPrompt(requestDto.getQuestion(), contextText);

        log.info("Final prompt sent to Gemini: {}", userPrompt);

        return chatClient.prompt()
                .user(userPrompt)
                .stream()
                .content()
                .doOnNext(chunk -> log.info("Gemini response chunk: {}", chunk))
                .doOnError(error -> log.error("Gemini streaming error", error))
                .doOnComplete(() -> log.info("Gemini streaming completed"));
    }

    private String buildContextString(List<Document> similarDocuments){
     if(similarDocuments ==null || similarDocuments.isEmpty()){
         return "";
     }

     //single chunks take and after cpmbing metadata to text make all each doc/chunks into 1 sinle stream by concatening
     return similarDocuments.stream()
             .map(doc->{
                 String fileName=(String) doc.getMetadata().getOrDefault("fileName","unknown file");
                 Object page= doc.getMetadata().getOrDefault("pageNumber", "N/A");
                 return String.format("[Source: %s | Page: %s]\n%s", fileName, page, doc.getText());

             })
             .collect(Collectors.joining("\\n\\n--\\\n\\n"));
    }


//    private String buildPrompt(@NotBlank(message = "Question cannot be empty") String question, String contextText){
//        if(contextText==null || contextText.isBlank()) {
//            return String.format("""
//                    Document Context:
//                                    .................
//                                    %s
//                                    .................
//                                    User Mesaage/ Question: %s
//
//                                    Instructions:
//                                    -if the user's question relates to the document context above, prioritize answering using that context and references key sections.
//                                    -if the user is asking a general question, greeting or discussing topics beyond the document context, respond helpfully and conversationally using your
//                    """, contextText, question);
//        }else{ //if no context that generate based question generate
//            return  String.format("""
//                        User Message/ Questions:
//                        %s
//                        Instructions:
//                            - Respond helpfully, accurately, and conversationally to the user's message using your broad knowledge base
//                    """,contextText,question);
//
//        }
//    }
private String buildPrompt(String question, String contextText) {

    if (contextText == null || contextText.isBlank()) {

        return String.format("""
                You are DockMind, a helpful AI assistant.

                User Question:
                %s

                Instructions:
                - Answer general questions helpfully.
                - If the user asks about an uploaded document
                  but no relevant context is available, explain that.
                - Never invent document-specific information.
                """, question);
    }

    return String.format("""
            You are DockMind, an AI document assistant.

            Document Context:
            -------------------------
            %s
            -------------------------

            User Question:
            %s

            Instructions:
            - Answer using the provided document context.
            - Do not invent information.
            - If information is unavailable in the context, say so.
            - Recommend relevant job roles based on the candidate's skills.
            - Explain your recommendations clearly.
            """, contextText, question);
}
    // create a instruction and pass to vectorstore to convert query-> imbedding , search top k(based on iinstruction provided)
    public SearchResultDto searchSimilarChunks(SearchRequestDto request){
        List<Document> matchedDocs =retrieveRelevantDocuments(
                request.getQuery(),
                request.getDocumentId(), // vector_store each chunk id
                request.getTopK(),
                request.getSimilaritySearch()
        );
        List<CitationDto> citations=matchedDocs.stream()
                .map(this::mapToCitation)
                .toList();
        return SearchResultDto.builder()
                .query(request.getQuery())
                .totalMatches(citations.size())
                .matches(citations)
                .build();
    }
    private CitationDto mapToCitation(Document document){
        Map<String,Object> meta=document.getMetadata(); // AI method
        UUID docId =null;
        if(meta.get("documentId") != null){
            try{
                docId=UUID.fromString((String) meta.get("documentId"));
            }catch(Exception ignore){

            }
        }
        Integer chunkIndex=null;
        if(meta.get("chunkIndex") instanceof Number n){
            chunkIndex=n.intValue();
        }

        Integer pageNumber=null;
        if(meta.get("pageNumber") instanceof Number n){
            pageNumber=n.intValue();
        } else if (meta.get("page_number") instanceof Number n) {
            pageNumber=n.intValue();
        }
        Double score=null;
        if(meta.get("distance")instanceof Number n){
            score=n.doubleValue();
        }
        return CitationDto.builder()
                .documentId(docId)
                .fileName(String.valueOf(meta.getOrDefault("fileName", "Unknown")))
                .chunkIndex(chunkIndex)
                .pageNumber(pageNumber)
                .snippet(document.getText())
                .similarityScore(score)
                .metadata(meta)
                .build();
    }

    // object build to send instruction like topk and threashold and pass to vectorstore to retrieve(index convert question or query --> compared vector with stored vector   ---> apply topK & Threshold );
    private List<Document> retrieveRelevantDocuments(@NotBlank(message = "Query cannot be empty") String query, UUID documentId, Integer topK, Double similaritySearch){
        int effectiveTopK = (topK!=null && topK>0)?topK:appProperties.getRag().getTopK();
        double effectiveSimilarity = (similaritySearch !=null) ? similaritySearch: appProperties.getRag().getSimilarityThreshold();
        SearchRequest.Builder searchRequestBuilder=SearchRequest.builder().query(query).topK(effectiveTopK);// preapre instruction to search
        if(effectiveSimilarity>0.0){
            searchRequestBuilder.similarityThreshold(effectiveSimilarity);
        }
        if(documentId!=null){
            FilterExpressionBuilder b=new FilterExpressionBuilder();
            searchRequestBuilder.filterExpression(b.eq("documentId",documentId.toString()).build()); // apply filter provide doc id and fetch
        }
        try{
            List<Document> documents=vectorStore.similaritySearch(searchRequestBuilder.build()); // based on instruction retreive documents chunks
            log.info("Retreived{} chunks for query: '{}'(scoped docId: {})",documents.size(),query,documentId);
            return documents;
        }
        catch (Exception e){
            log.error("Similarity search failed!",query,e);
            return Collections.emptyList();
        }
    }
}
