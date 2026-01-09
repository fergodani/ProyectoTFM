import os
import socket
import sys
import time


def wait(host, port, timeout=3):
    try:
        # resolve addresses (IPv4/IPv6)
        infos = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
    except socket.gaierror:
        return False

    for family, socktype, proto, canonname, sockaddr in infos:
        s = socket.socket(family, socktype, proto)
        s.settimeout(timeout)
        try:
            s.connect(sockaddr)
            s.close()
            return True
        except Exception:
            try:
                s.close()
            except Exception:
                pass
    return False


if __name__ == '__main__':
    host = os.getenv('DB_HOST', 'db')
    port = int(os.getenv('DB_PORT', '5432'))
    ok = wait(host, port)
    if ok:
        print(f"DB reachable at {host}:{port}")
        sys.exit(0)
    else:
        print(f"DB NOT reachable at {host}:{port}")
        sys.exit(1)
