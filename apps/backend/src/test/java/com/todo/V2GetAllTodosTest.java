package com.todo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TodoController.class)
class V2GetAllTodosTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    TodoRepository repository;

    @Test
    void returnsEmptyArrayWhenNoTodosExist() throws Exception {
        given(repository.findAllByOrderByCreatedAtAsc()).willReturn(List.of());

        mvc.perform(get("/api/todos"))
                .andExpect(status().isOk())
                .andExpect(content().json("[]"));
    }

    @Test
    void returnsAllTodosOrderedByCreationTime() throws Exception {
        Todo first = new Todo();
        first.setText("Buy milk");
        Todo second = new Todo();
        second.setText("Call dentist");

        given(repository.findAllByOrderByCreatedAtAsc()).willReturn(List.of(first, second));

        mvc.perform(get("/api/todos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].text").value("Buy milk"))
                .andExpect(jsonPath("$[1].text").value("Call dentist"));
    }
}
