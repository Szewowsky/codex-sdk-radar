# Profile sandboxa dla kontenera radaru

Sandbox Codexa (bubblewrap) sam izoluje komendy agenta w przestrzeniach nazw. Domyślne profile
Dockera (seccomp + AppArmor `docker-default`) blokują mu to, więc w kontenerze sandbox nie startuje.

- `radar-bwrap.apparmor` - profil `docker-default` plus: `userns create`, `mount`, `remount`, `pivot_root`.
- `radar-bwrap-seccomp.json` - domyślny profil seccomp Dockera plus odpowiadające im wywołania
  systemowe (m.in. `unshare`, `clone` z flagami przestrzeni nazw, `mount`, `umount2`, `pivot_root`).
- `install-sandbox-profile.sh` - jednorazowo, z `sudo`, ładuje profil AppArmor do jądra serwera.

Oba profile dotyczą **tylko kontenera radaru** (`security_opt` w `docker-compose.yml`). Dlatego nie
`privileged: true` (pełny dostęp do hosta), nie `apparmor=unconfined` (zero ochrony) i nie
`sysctl kernel.apparmor_restrict_unprivileged_userns=0` (luzuje cały serwer, nie jeden kontener).

Odinstalowanie (po `docker compose down`):

```bash
sudo apparmor_parser -R /etc/apparmor.d/radar-bwrap && sudo rm /etc/apparmor.d/radar-bwrap
```
