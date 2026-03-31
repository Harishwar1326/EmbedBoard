package com.example.backend.controller;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestClient;

import java.net.URI;
import java.time.Duration;
import java.util.Locale;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/preview")
public class PreviewController {

    private final RestClient restClient;

    public PreviewController() {
        this.restClient = RestClient.builder()
                .defaultHeader(HttpHeaders.USER_AGENT, "EmbedBoardBot/1.0")
                .build();
    }

    @GetMapping
    public PreviewResponse getPreview(@RequestParam("url") String rawUrl) {
        String normalizedUrl = normalizeUrl(rawUrl);
        URI uri = URI.create(normalizedUrl);

        PreviewResponse response = new PreviewResponse();
        response.setUrl(normalizedUrl);
        response.setDomain(extractDomain(uri));
        response.setTitle(response.getDomain());
        response.setDescription("Open this link in browser");
        response.setThumbnail("");
        response.setEmbeddable(true);

        response.setEmbeddable(checkEmbeddable(normalizedUrl));

        try {
            Document doc = Jsoup.connect(normalizedUrl)
                    .userAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                    .timeout((int) Duration.ofSeconds(8).toMillis())
                    .followRedirects(true)
                    .get();

            String title = firstNonBlank(
                    selectContent(doc, "meta[property=og:title]"),
                    selectContent(doc, "meta[name=twitter:title]"),
                    doc.title());

            String description = firstNonBlank(
                    selectContent(doc, "meta[property=og:description]"),
                    selectContent(doc, "meta[name=twitter:description]"),
                    selectContent(doc, "meta[name=description]"));

            String image = firstNonBlank(
                    selectContent(doc, "meta[property=og:image]"),
                    selectContent(doc, "meta[name=twitter:image]"),
                    selectContent(doc, "meta[name=twitter:image:src]"));

            if (StringUtils.hasText(title)) {
                response.setTitle(title.trim());
            }
            if (StringUtils.hasText(description)) {
                response.setDescription(description.trim());
            }
            if (StringUtils.hasText(image)) {
                response.setThumbnail(toAbsoluteUrl(doc, image.trim()));
            }
        } catch (Exception ignored) {
            // Keep sensible defaults if metadata fetch fails.
        }

        return response;
    }

    private boolean checkEmbeddable(String url) {
        try {
            ResponseEntity<Void> head = restClient.head()
                    .uri(url)
                    .retrieve()
                    .toBodilessEntity();
            return evaluateEmbeddableHeaders(head.getHeaders());
        } catch (Exception ignored) {
            try {
                ResponseEntity<Void> get = restClient.get()
                        .uri(url)
                        .retrieve()
                        .toBodilessEntity();
                return evaluateEmbeddableHeaders(get.getHeaders());
            } catch (Exception ignoredAgain) {
                return true;
            }
        }
    }

    private boolean evaluateEmbeddableHeaders(HttpHeaders headers) {
        String xFrame = headers.getFirst("X-Frame-Options");
        if (StringUtils.hasText(xFrame)) {
            String value = xFrame.toLowerCase(Locale.ROOT);
            if (value.contains("deny") || value.contains("sameorigin")) {
                return false;
            }
        }

        String csp = headers.getFirst("Content-Security-Policy");
        if (StringUtils.hasText(csp)) {
            String lower = csp.toLowerCase(Locale.ROOT);
            if (lower.contains("frame-ancestors")) {
                return !lower.contains("'none'") && !lower.contains("'self'");
            }
        }

        MediaType contentType = headers.getContentType();
        if (contentType != null && !MediaType.TEXT_HTML.isCompatibleWith(contentType)) {
            return false;
        }

        return true;
    }

    private String normalizeUrl(String input) {
        String trimmed = input == null ? "" : input.trim();
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            return trimmed;
        }
        return "https://" + trimmed;
    }

    private String extractDomain(URI uri) {
        String host = uri.getHost();
        if (!StringUtils.hasText(host)) {
            return "Unknown site";
        }
        return host.startsWith("www.") ? host.substring(4) : host;
    }

    private String selectContent(Document doc, String selector) {
        return doc.select(selector).attr("content");
    }

    private String toAbsoluteUrl(Document doc, String value) {
        if (value.startsWith("http://") || value.startsWith("https://")) {
            return value;
        }
        String absolute = doc.baseUri();
        if (!StringUtils.hasText(absolute)) {
            return value;
        }
        try {
            return URI.create(absolute).resolve(value).toString();
        } catch (Exception ignored) {
            return value;
        }
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value;
            }
        }
        return "";
    }

    public static class PreviewResponse {
        private String url;
        private String domain;
        private String title;
        private String description;
        private String thumbnail;
        private boolean embeddable;

        public String getUrl() {
            return url;
        }

        public void setUrl(String url) {
            this.url = url;
        }

        public String getDomain() {
            return domain;
        }

        public void setDomain(String domain) {
            this.domain = domain;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getThumbnail() {
            return thumbnail;
        }

        public void setThumbnail(String thumbnail) {
            this.thumbnail = thumbnail;
        }

        public boolean isEmbeddable() {
            return embeddable;
        }

        public void setEmbeddable(boolean embeddable) {
            this.embeddable = embeddable;
        }
    }
}
