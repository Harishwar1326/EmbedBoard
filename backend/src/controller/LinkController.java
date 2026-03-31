package com.app.embed.controller;

import com.app.embed.model.Link;
import com.app.embed.repository.LinkRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/links")
public class LinkController {

    private final LinkRepository repo;

    public LinkController(LinkRepository repo) {
        this.repo = repo;
    }

    @PostMapping
    public Link addLink(@RequestBody Link link) {
        return repo.save(link);
    }

    @GetMapping
    public List<Link> getAllLinks() {
        return repo.findAll();
    }
}