package dockmind_backend.example.dockmind.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.modelmapper.ModelMapper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ProjectConfig {

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder){
        return builder
                .defaultSystem("""
                        You are DocMind, an intelligent, versatile and friendly AI documeny intelligence assistant.
                        
                                                Your Capabilities:
                                                1.Document-Grounded Q&A: When context from the user's uploaded document is provided, prioritize and base your answer directly on that context, citing documents names and page numbers when available.
                                                2.General Knowledge & Conversation: If the user engages in general conversation(greetings, chit-chat, programming questions, math,explanation,summaries, or general knowledge) that may not be present in the uploaded document, answer helpfully, accurately, and naturally.
                                                3.Hybrid Synthesis: If the document context partially covers a topic, synthesis the document facts with your  broader knowledge to give a complete, high-quality answer.
                                                4.Tone & Format: Always be warm, professional, clear and structured. Use Markdown(headings, bullet points, bold text, code blocks) to make response easy to read.
                                                
                                                
                        """)
                .build();

    }

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(
                        new Info()
                                .title("DockMind - AI Document Intelligence & RAG Backend")
                                .description("REST API for DockMind: Multi-format document ingestion, vector embeddings, and retrieval using PostgreSQL with PGVector.")
                                .version("1.0.0")
                                .contact(
                                        new Contact()
                                                .name("Substring Tech")
                                                .email("support@substringtechnologies.com")
                                                .url("https://substringtechnologies.com")
                                )
                );
    }

    @Bean
    public ModelMapper modelMapper(){
        return new ModelMapper();
    }
}