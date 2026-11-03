package dockmind_backend.example.dockmind.controller;
import dockmind_backend.example.dockmind.dto.*;
import dockmind_backend.example.dockmind.service.RagService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.PostConstruct;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.time.LocalDateTime;


@RestController
@RequestMapping("/api/v1/chat")
@Tag(
        name="Chat Management",
        description ="All chat related APIs are here"
)
@RequiredArgsConstructor
public class ChatController {

    private final RagService ragService;

    @PostMapping("/query") // retrieve +LLM prompt response
    @Operation(summary = "Ask a question against all documents or a specific document with citations")
    public ResponseEntity<ApiResponse> askQuestion(@Valid @RequestBody ChatRequestDto requestDto){

        ChatResponseDto chatResponseDto=ragService.askQuestion(requestDto);
        return ResponseEntity.ok(
                ApiResponse.
                        <ChatResponseDto>
                        builder()
                        .success(true)
                        .message("Chat send sucessfully fetched the matching data and create a LLm response ")
                        .data(chatResponseDto)
                        .timestamp(LocalDateTime.now())
                        .build()
        );
    }

    @PostMapping("/stream") // stream response in short real time and LLM response
    @Operation(summary = "Stream real-time A&A answer tokens via Server-sent Events(SSE)")
    public Flux<String>  streamQuestions(@Valid @RequestBody ChatRequestDto requestDto){
        return ragService.streamQuestionAnswer(requestDto);
    }

    //only retreive similar chunks from vector store
    @PostMapping("/search/similarity")
    @Operation(summary = "Perform semantic similarity serach on scored documents in vector store")
    public ResponseEntity<ApiResponse> searchSimilar(@Valid @RequestBody SearchRequestDto request){
        SearchResultDto results=ragService.searchSimilarChunks(request);// only fetch similar
        return ResponseEntity.ok(
                ApiResponse.
                        <SearchResultDto>
                        builder()
                        .success(true)
                        .data(results)
                        .message(null)
                        .timestamp(LocalDateTime.now())
                        .build()
                );
    }

}
