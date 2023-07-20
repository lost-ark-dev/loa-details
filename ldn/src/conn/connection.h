#ifndef LDN_CONNECTION_H
#define LDN_CONNECTION_H
#include <string>
#ifdef _WIN32
#include <winsock2.h>
#include <WS2tcpip.h>
#include <windows.h>
#endif
#include <thread>
#include <nlohmann/json.hpp>
#include <mutex>

class SocketConnection {
public:
    void connect(std::string port);
    void loop();
    nlohmann::json getLatestData();
    ~SocketConnection();
private:
    int connect_socket(std::string port);
    uint8_t* recv_buffer = nullptr;
    int sockfd, status;
    bool connected = false;
    bool running = false;
    bool blocked = false;
    bool partial = false;
    std::string last_data;
    std::string buffer_data;
    std::thread socket_thread;
    std::mutex mtx;
};
#endif