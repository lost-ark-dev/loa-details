cmake_minimum_required(VERSION 3.16)
project("ldn")
set(CMAKE_CXX_STANDARD 17)
set(DISABLE_PACKAGE_CONFIG_AND_INSTALL ON)
set(SKIP_INSTALL_ALL ON)
set(WEBP_BUILD_ANIM_UTILS OFF)
set(WEBP_BUILD_CWEBP OFF)
set(WEBP_BUILD_DWEBP OFF)
set(WEBP_BUILD_GIF2WEBP OFF)
set(WEBP_BUILD_IMG2WEBP OFF)
set(WEBP_BUILD_VWEBP OFF)
set(WEBP_BUILD_WEBPINFO OFF)
set(WEBP_BUILD_LIBWEBPMUX OFF)
set(WEBP_BUILD_WEBPMUX OFF)
set(WEBP_BUILD_EXTRAS OFF)
set(WEBP_BUILD_WEBP_JS OFF)
set(WEBP_USE_THREAD OFF)
set(WEBP_NEAR_LOSSLESS "Enable near-lossless encoding" ON)
set(WEBP_ENABLE_SWAP_16BIT_CSP "Enable byte swap for 16 bit colorspaces."
       OFF)

set(LDN_SOURCES
    third-party/png/lodepng.cpp 
    src/main.cc 
    src/rendering/font_atlas.cc 
    src/rendering/glad.c 
    src/rendering/la.cc 
    src/rendering/opengl_state.cc 
    src/rendering/shader.cc 
    src/ldn.cc 
    src/components/text.cc 
    src/components/box.cc 
    src/components/row.cc 
    src/components/meter_header_row.cc 
    src/components/meter_row.cc 
    src/components/row_list.cc 
    src/components/button.cc 
    src/components/image.cc 
    src/components/header.cc 
    src/components/lower_row.cc 
    src/conn/connection.cc 
    src/conn/data_manager.cc 
    src/conn/static_data.cc 
    src/utils/image_cache.cc
    )


add_executable(ldn ${LDN_SOURCES})


target_include_directories(ldn PRIVATE third-party/json/single_include)
target_include_directories(ldn PRIVATE third-party/zlib ${CMAKE_CURRENT_BINARY_DIR}/third-party/zlib)

add_subdirectory(third-party/zlib)
set(ZLIB_LIBRARY zlibstatic)
set(ZLIB_LIBRARIES zlibstatic)
set(ZLIB_INCLUDE_DIRS  ${CMAKE_CURRENT_SOURCE_DIR}/third-party/zlib ${CMAKE_CURRENT_BINARY_DIR}/third-party/zlib)
set(ZLIB_INCLUDE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/third-party/zlib ${CMAKE_CURRENT_BINARY_DIR}/third-party/zlib)

add_subdirectory(third-party/glfw)
add_subdirectory(third-party/freetype2)
add_subdirectory(third-party/libwebp)

if(WIN32)
    add_definitions(-DGLFW_EXPOSE_NATIVE_WIN32)
    target_link_libraries(ldn PUBLIC glfw freetype wsock32 ws2_32 webp)
endif()
file(COPY assets DESTINATION .)
