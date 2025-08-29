/**
 * @jest-environment jsdom
 */

import { screen } from "@testing-library/dom";
import NewBillUI from "../views/NewBillUI.js";
import NewBill from "../containers/NewBill.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then ...", () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      //to-do write assertion
    });
  });
  describe("When I am on NewBill Page and I upload a invalid file", () => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );
    test("Must display an alert and reset the field", () => {
      window.alert = jest.fn();
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const store = null;
      const newBill = new NewBill({
        document,
        onNavigate,
        store,
        localStorage: localStorageMock,
      });
      const fakeEvent = {
        preventDefault: jest.fn(),
        target: {
          value: "C:\\fakepath\\test.txt",
          files: [new File(["test"], "test.txt", { type: "text/plain" })],
        },
      };
      newBill.handleChangeFile(fakeEvent);
      expect(window.alert).toHaveBeenCalledWith(
        "Format de fichier invalide. Seuls les fichiers JPEG, JPG et PNG sont autorisés."
      );
      expect(fakeEvent.target.value).toBe("");
    });
  });
  describe("When I am on NewBill Page and I upload a valid file", () => {
    Object.defineProperty(window, "localStorage", {
      value: localStorageMock,
    });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
      })
    );

    test("Must NOT display an alert and must keep the field value", async () => {
      window.alert = jest.fn();

      const mockStore = {
        bills: jest.fn(() => ({
          create: jest.fn().mockResolvedValue({
            fileUrl: "http://localhost/image.png",
            key: "1234",
          }),
        })),
      };
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      const newBill = new NewBill({
        document,
        onNavigate,
        store: mockStore,
        localStorage: localStorageMock,
      });

      const fakeEvent = {
        preventDefault: jest.fn(),
        target: {
          value: "C:\\fakepath\\image.png",
          files: [new File(["image"], "image.png", { type: "image/png" })],
        },
      };

      await newBill.handleChangeFile(fakeEvent);

      expect(window.alert).not.toHaveBeenCalled();
      expect(fakeEvent.target.value).toBe("C:\\fakepath\\image.png");
    });
  });
});
