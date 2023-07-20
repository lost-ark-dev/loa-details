#ifndef LDN_IMAGE_CACHE
#define LDN_IMAGE_CACHE

#include <map>
#include <string>
#include "file_util.h"
#include "../components/image.h"


class ImageCache {
private:
    std::map<std::string, Image*> images;
public:
    Image* getImage(const std::string& path);
};

#endif