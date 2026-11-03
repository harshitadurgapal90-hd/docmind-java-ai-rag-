package dockmind_backend.example.dockmind.service;


import dockmind_backend.example.dockmind.exception.DocumentProcessingException;
import org.jspecify.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.reader.ExtractedTextFormatter;
import org.springframework.ai.reader.pdf.PagePdfDocumentReader;
import org.springframework.ai.reader.pdf.config.PdfDocumentReaderConfig;
import org.springframework.ai.reader.tika.TikaDocumentReader;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.ai.document.Document;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class DocumentParserService {
    // ni ai used here
    private final static Logger log= LoggerFactory.getLogger(DocumentParserService.class);
    public List<Document> parse(MultipartFile file){
        String fileName= file.getOriginalFilename() !=null ? file.getOriginalFilename(): "document";
        String contentType= file.getContentType()!=null ? file.getContentType(): "application/octet-stream";
        log.info("Parsing document: {}, size: {} bytes, contentType: {}, fileName, file.getSize(), contentType: {}", fileName, file.getSize(), contentType, file.getSize());
        try {
            //file data in byte array to resource object
            //file read ,Some Spring APIs work with the Resource abstraction rather than directly accepting MultipartFile or byte[]. like spring ai works with resource well
            Resource resource = new ByteArrayResource(file.getBytes()){
                //The default ByteArrayResource implementation does not provide a filename (it returns null),So you override the method to return the original filename.
                @Override
                public @Nullable String getFilename() {
                    return fileName;
                }
            };

            if(fileName.toLowerCase().endsWith(".pdf")||contentType.contains("application/pdf")){
                return parsePdf(resource);
            }
            else{
                return parseGenericFile(resource);
            }
        }
        catch (IOException e){
            log.error("Failed to read file bytes{}"+fileName,e);
            throw new DocumentProcessingException("Could not read uplaoded file:"+ fileName,e);
        }
        catch (Exception e){
            log.error("Failed during document parsing: {}"+fileName,e);
            throw new DocumentProcessingException("Failed to parse document content:"+fileName,e);
        }
    }

    /**
     * With PagePdfDocumentReader:
     * - It uses PDF parsing technology (Spring AI's PDF reader implementation, backed by PDFBox in the standard implementation).
     * - It reads the PDF's internal text content.
     * - It extracts text from pages.
     * - It creates Spring AI Document objects.
     * With TikaDocumentReader:
     * - It uses Apache Tika, a document-parsing library,a: An independent Java library that extracts text and metadata from files such as PDF, DOCX, PPTX and HTML,but Spring AI provides a reader that uses Tika..
     * - Tika uses format-specific parsers to read PDF, DOCX, PPTX and other supported formats.
     * - It extracts text and metadata.
     * - It creates Spring AI Document objects.
     * @param resource
     * @return
     */
    //Extracts content from PDFs, with page-level control.
    private List<Document> parsePdf(Resource resource){

        PagePdfDocumentReader documentReader = new PagePdfDocumentReader(resource,
                PdfDocumentReaderConfig.builder()
                        .withPageTopMargin(0)
                        .withPageExtractedTextFormatter(ExtractedTextFormatter.builder()
                        .withNumberOfTopTextLinesToDelete(0)
                        .build())
                        .withPagesPerDocument(1)
                        .build());//This configures how the PDF reader should extract text.
        return documentReader.read();  // implement document reader via pdf reader and use its read method
    }
    //but Spring AI provides a reader that uses Tika.
    //Uses Apache Tika internally is java libarry but spring ai provide apache tike reader to us by adding depenedny.Supports formats such as PDF, DOCX, PPTX, TXT and HTML, depending on Tika's installed parsers.
    private List<Document> parseGenericFile(Resource resource){
        TikaDocumentReader tikaDocumentReader=new TikaDocumentReader(resource);
        return tikaDocumentReader.read();
    }
}
