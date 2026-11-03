package dockmind_backend.example.dockmind.config;


import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
public class CorsConfig implements WebMvcConfigurer {
    private final AppProperties appProperties;

    //frontend and backend at didffrent origins when frontend send reuqest to backend it rejects if not done cors configurations
    public void addCorsMappings(CorsRegistry registry) {
        String[] allowedOrigins=appProperties.getCors().getAllowedOrigins().split(",");
        String[] allowedMethods=appProperties.getCors().getAllowedMethods().split(",");
        String[] allowedHeaders=appProperties.getCors().getAllowedHeaders().split(",");

        registry.addMapping("/**")
                .allowedOriginPatterns(allowedOrigins)
                .allowedMethods(allowedMethods)
                .allowedHeaders(allowedHeaders)
                .allowCredentials(true);

    }
}
