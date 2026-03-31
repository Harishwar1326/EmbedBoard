package com.example.backend.controller;

import com.example.backend.model.Link;
import com.example.backend.repository.LinkRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ResponseStatus;

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

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteLink(@PathVariable Long id) {
        if (repo.existsById(id)) {
            repo.deleteById(id);
        }
    }
}
