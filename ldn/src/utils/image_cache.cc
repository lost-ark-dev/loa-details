#include "image_cache.h"
#include "file_util.h"
#include <filesystem>
#include <vector>


Image* ImageCache::getImage(const std::string& path){

    if(images.count(path))
        return images[path];
    std::filesystem::path base = "./meter-data/images";
    std::filesystem::path t = base / path;
    std::vector<uint8_t> data = FileUtils::read_bin(t.generic_string());
    Image* img = new Image();
    img->load(data);
    images[path] = img;
    return img;
}