#include <iostream>
#include <stdint.h>
#include <vector>
#include "ldn.h"

int main(int argc, char** argv) {
    Ldn ldn;
    if(argc == 3) {
        std::string what = std::string(argv[1]);
        ldn.run(what != "file", std::string(argv[2]));
        return 0;
    }
    return 0;
}