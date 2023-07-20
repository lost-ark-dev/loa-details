#include "image.h"
#include "../../third-party/png/lodepng.h"

bool Image::canFocus() {
    return false;
}
void Image::onPress(RenderContext* ctx) {

}
void Image::onFocus(bool focus) {

}
void Image::render(RenderContext* ctx) {

    if(!was_decoded)
        decode(ctx);
    if(failed)
        return;
    auto target_size = size;
    if(native_width > native_height) {
        auto scale = target_size.x / native_width;
        target_size.y = native_height * scale;
    } else {
        auto scale = target_size.y / native_height;
        target_size.x = native_width * scale;
    }
    auto target_pos = position;
    if(center) {
        if(target_size.x < size.x)
            target_pos.x += (size.x - target_size.x) / 2;
        if(target_size.y < size.y)
            target_pos.y += (size.y - target_size.y) / 2;
    }
    SimpleEntry entry = {ctx->normalize(target_pos), target_size};
    auto* shader = ctx->gl_state->image_shader;
    shader->shader.use();
    shader->bindVertexArray();
    shader->bindBuffer();
    glBindTexture(GL_TEXTURE_2D, tex_id);
    glBufferSubData(GL_ARRAY_BUFFER, 0, sizeof(SimpleEntry), &entry);
    glBindBuffer(GL_ARRAY_BUFFER, 0);
    glDrawArraysInstanced(GL_TRIANGLE_STRIP, 0, 6, 1);
}
void Image::load(std::vector<uint8_t>& encoded_data) {
    this->encoded_data = encoded_data;
    this->was_decoded = false;
    this->failed = false;
    this->decoded_data.clear();
    this->native_height = 0;
    this->native_width = 0;
    if(was_loaded) {
        glDeleteTextures(1, &tex_id);
    }

}
void Image::decode(RenderContext* ctx) {
    if(was_decoded || failed)
        return;
    if(was_loaded) {
        glDeleteTextures(1, &tex_id);
    }

    unsigned error = lodepng::decode(decoded_data, native_width, native_height, encoded_data);
    if(error != 0) {
        failed= true;
        return;
    }
    glGenTextures(1, &tex_id);
    glActiveTexture(GL_TEXTURE0);
    glBindTexture(GL_TEXTURE_2D, tex_id);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);

    glPixelStorei(GL_UNPACK_ALIGNMENT, 1);

    glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA8, (GLsizei)native_width, (GLsizei)native_height, 0,
                 GL_RGBA, GL_UNSIGNED_BYTE, nullptr);
    glTexSubImage2D(GL_TEXTURE_2D, 0, 0, 0, native_width, native_height, GL_RGBA,
                    GL_UNSIGNED_BYTE, &decoded_data[0]);

    was_decoded = true;
    was_loaded = true;

}