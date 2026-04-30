package com.todo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TodoController.class)
class V2DeleteTodoTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    TodoRepository repository;

    @Test
    void deletesTodoByIdAndReturnsNoContent() throws Exception {
        mvc.perform(delete("/api/todos/1"))
                .andExpect(status().isNoContent());

        verify(repository).deleteById(1);
    }

    @Test
    void deletesAllTodosAndReturnsNoContent() throws Exception {
        mvc.perform(delete("/api/todos"))
                .andExpect(status().isNoContent());

        verify(repository).deleteAll();
    }
}
