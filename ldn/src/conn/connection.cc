#include "connection.h"
#include <chrono>
#include <exception>
#include <iostream>
#include <mutex>
#include <thread>
#include <vector>
using json = nlohmann::json;
int SocketConnection::connect_socket(std::string port) {

  struct addrinfo *result = NULL, *ptr = NULL, hints;
  int iResult;

  ZeroMemory(&hints, sizeof(hints));
  hints.ai_family = AF_UNSPEC;
  hints.ai_socktype = SOCK_STREAM;
  hints.ai_protocol = IPPROTO_TCP;

  iResult = getaddrinfo("127.0.0.1", port.c_str(), &hints, &result);
  if (iResult != 0) {
    printf("getaddrinfo failed with error: %d\n", iResult);
    return 1;
  }

  for (ptr = result; ptr != NULL; ptr = ptr->ai_next) {

    sockfd = socket(ptr->ai_family, ptr->ai_socktype, ptr->ai_protocol);
    if (sockfd == INVALID_SOCKET) {
      printf("socket failed with error: %d\n", WSAGetLastError());
      WSACleanup();
      return 1;
    }
    iResult = ::connect(sockfd, ptr->ai_addr, (int)ptr->ai_addrlen);
    if (iResult == SOCKET_ERROR) {
      closesocket(sockfd);
      sockfd = INVALID_SOCKET;
      continue;
    }
    break;
  }
  freeaddrinfo(result);
  if (sockfd == INVALID_SOCKET) {
    printf("Unable to connect to server!\n");
    return 1;
  }
  connected = true;
  return 0;
}
json SocketConnection::getLatestData() {
  std::lock_guard<std::mutex> lk(mtx);
  if (messages.size()) {
    std::string first = messages.front();
    messages.pop_front();
    return json::parse(first);
  }
  if (!last_data.length())
    return json::object();
  json j = json::parse(last_data);
  blocked = false;
  return j;
}
void SocketConnection::sendReset(){
  std::lock_guard<std::mutex> lk(mtx);
  if(!connected)
    return;
  json j;
  j["action"] = "reset-session";
  std::string d = j.dump();
  send(sockfd, d.c_str(), d.length(), 0);
}
void SocketConnection::connect(std::string port) {
  running = true;
  socket_thread = std::thread([this, port]() {
    WSADATA wsaData;

    int iResult = WSAStartup(MAKEWORD(2, 2), &wsaData);
    if (iResult != 0) {
      printf("WSAStartup failed with error: %d\n", iResult);
      return 1;
    }
    while (running) {
      connect_socket(port);
      loop();
      connected = false;
      closesocket(sockfd);
      if (running)
        std::cout << "reconnecting\n";
      std::this_thread::sleep_for(std::chrono::milliseconds(25));
    }
    WSACleanup();
    return 0;
  });
}
void SocketConnection::loop() {
  recv_buffer = new uint8_t[1024 * 1024];
  const auto header_size = (sizeof(char) * 2);
  while (running) {
    auto amount_read = recv(sockfd, (char *)recv_buffer, 1024 * 1024, 0);
    if (amount_read > 0) {
      std::lock_guard<std::mutex> lk(mtx);
      buffer_data += std::string(recv_buffer, recv_buffer + amount_read);
      auto index = buffer_data.find("\n");
      size_t count = 0;
      while (index != std::string::npos) {
        std::string msg = buffer_data.substr(0, index);
        count++;
        if (msg[0] == 'm')
          messages.push_back(msg.substr(2));
        else
          last_data = msg.substr(2);
        if (index == buffer_data.length() - 1) {
          buffer_data = "";
          break;
        } else {
          buffer_data = buffer_data.substr(index + 1);
        }
        index = buffer_data.find("\n");
      }
    } else {
      break;
    }
  }
  delete[] recv_buffer;
  recv_buffer = nullptr;
}
SocketConnection::~SocketConnection() {
  if (!running)
    return;
  running = false;
  socket_thread.join();
  std::cout << "joined thread\n";
}