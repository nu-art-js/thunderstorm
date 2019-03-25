# Project Template

To run the project without library sources

```bash
git clone --recursive git@github.com:nu-art-js/typescript-boilerplate.git my-project
cd my-project
bash build-and-install.sh --set-env=dev --setup --launch-frontend --launch-backend
```

---

To run the project with library sources without frontend sources hack

```bash
git clone --recursive git@github.com:nu-art-js/typescript-boilerplate.git my-project
cd my-project
bash build-and-install.sh --nu-art --set-env=dev --setup --launch-frontend --launch-backend --no-frontend-hack
```

--- 

To run the project with library sources

```bash
git clone --recursive git@github.com:nu-art-js/typescript-boilerplate.git my-project
cd my-project
bash build-and-install.sh --nu-art --set-env=dev --setup --launch-frontend --launch-backend
```